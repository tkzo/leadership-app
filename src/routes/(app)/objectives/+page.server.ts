import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getObjectivesWithReceivedFrom,
	getObjectivesByOwnerAndType,
	getObjectiveById,
	createObjective,
	deleteObjective,
	updateObjective
} from '$lib/db/queries/objectives';
import { getAllStrategicPriorities } from '$lib/db/queries/strategic-priorities';
import {
	getOutgoingSharesByUser,
	getAllIncomingSharedBigRocks,
	createSharedBigRock,
	addSharedBigRockRecipient,
	getSharedRecipientIds,
	getIncomingSharesFromManager,
	getSharedBigRockRecipient,
	updateRecipientAccepted,
	getSharedBigRockWithObjective
} from '$lib/db/queries/shared-big-rocks';
import { getUsersByManager, getUserById, getUsersByLevel } from '$lib/db/queries/users';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const objectives = await getObjectivesWithReceivedFrom(user.uid);
	const priorities = await getAllStrategicPriorities();
	const outgoingShares = await getOutgoingSharesByUser(user.uid);
	const reportees = await getUsersByManager(user.uid);
	const myBigRocks = await getObjectivesByOwnerAndType(user.uid, 'big_rock');

	// Same-level users for sharing (exclude self)
	const allSameLevelUsers = await getUsersByLevel(user.level);
	const sameLevelUsers = allSameLevelUsers.filter((u) => u.uid !== user.uid);

	// Get manager info for approval requests (level 3+)
	const manager = user.manager_id ? await getUserById(user.manager_id) : null;

	// Create a map of priorities for easy lookup
	const priorityMap = new Map(priorities.map((p) => [p.id, p.name]));

	// Group shares by objective ID
	const sharesByObjective = new Map<string, typeof outgoingShares>();
	for (const share of outgoingShares) {
		if (!sharesByObjective.has(share.objective_id)) {
			sharesByObjective.set(share.objective_id, []);
		}
		sharesByObjective.get(share.objective_id)!.push(share);
	}

	// Separate big rocks and RCIs
	const bigRocks = objectives.filter((o) => o.type === 'big_rock');
	const rcis = objectives.filter((o) => o.type === 'risk_critical_initiative');

	// Group RCIs by their parent big rock
	const rcisByParent = new Map<string | null, typeof rcis>();
	for (const rci of rcis) {
		const parentId = rci.parent_id;
		if (!rcisByParent.has(parentId)) {
			rcisByParent.set(parentId, []);
		}
		rcisByParent.get(parentId)!.push(rci);
	}

	// Build grouped data structure (like shared with me page)
	type ObjectiveType = typeof objectives[0];
	const groupedObjectives: Array<{
		bigRock: ObjectiveType & { sharedWith: typeof outgoingShares };
		rcis: Array<ObjectiveType & { sharedWith: typeof outgoingShares }>;
	}> = [];

	// Add Big Rocks with their child RCIs
	for (const br of bigRocks) {
		groupedObjectives.push({
			bigRock: {
				...br,
				sharedWith: sharesByObjective.get(br.id) || []
			},
			rcis: (rcisByParent.get(br.id) || []).map((rci) => ({
				...rci,
				sharedWith: sharesByObjective.get(rci.id) || []
			}))
		});
		// Remove from rcisByParent so we don't show them again
		rcisByParent.delete(br.id);
	}

	// Orphan RCIs (no parent big rock)
	const orphanRcis = (rcisByParent.get(null) || []).map((rci) => ({
		...rci,
		sharedWith: sharesByObjective.get(rci.id) || []
	}));

	// Check if user needs approval (level 3+) and has unapproved objectives
	const needsApproval = user.level >= 3;
	const hasUnapprovedObjectives = objectives.some((o) => !o.approved && !o.rejected);

	// Get cascaded objectives from manager
	let cascadedFromManager: Awaited<ReturnType<typeof getIncomingSharesFromManager>> = [];
	if (user.manager_id) {
		cascadedFromManager = await getIncomingSharesFromManager(user.uid, user.manager_id);
	}

	// (cascaded grouping with action labels is computed below after adoptedLookup)

	// Build lookup for how objectives were adopted (by received_from + name)
	const adoptedLookup = new Map<string, { type: string; parentName: string | null }>();
	for (const obj of objectives) {
		if (obj.received_from_user_id) {
			adoptedLookup.set(`${obj.received_from_user_id}:${obj.name}`, {
				type: obj.type,
				parentName: obj.parent_name
			});
		}
	}

	function computeAction(
		item: { accepted: boolean | null; from_user_id: string; objective_name: string },
		verb: string
	): { label: string; parentName?: string } | null {
		if (item.accepted === null) return null;
		if (item.accepted === false) return { label: 'Ignored' };
		const key = `${item.from_user_id}:${item.objective_name}`;
		const adopted = adoptedLookup.get(key);
		if (!adopted) return { label: `${verb}` };
		if (adopted.type === 'big_rock') return { label: `${verb} As Big Rock` };
		return { label: `${verb} As RCI`, parentName: adopted.parentName ?? undefined };
	}

	// Add action labels to cascaded items
	const cascadedWithActions = cascadedFromManager.map((item) => ({
		...item,
		action: computeAction(item, 'Adopted')
	}));

	// Re-group cascaded items with actions
	const cascadedBigRocksWithActions = cascadedWithActions.filter((o) => o.objective_type === 'big_rock');
	const cascadedRcisWithActions = cascadedWithActions.filter((o) => o.objective_type === 'risk_critical_initiative');

	const cascadedRcisByParentWithActions = new Map<string | null, typeof cascadedRcisWithActions>();
	for (const rci of cascadedRcisWithActions) {
		const parentId = rci.objective_parent_id;
		if (!cascadedRcisByParentWithActions.has(parentId)) {
			cascadedRcisByParentWithActions.set(parentId, []);
		}
		cascadedRcisByParentWithActions.get(parentId)!.push(rci);
	}

	type CascadedWithActionType = typeof cascadedWithActions[0];
	const groupedCascadedFinal: Array<{
		bigRock: CascadedWithActionType;
		rcis: CascadedWithActionType[];
	}> = [];

	for (const br of cascadedBigRocksWithActions) {
		groupedCascadedFinal.push({
			bigRock: br,
			rcis: cascadedRcisByParentWithActions.get(br.objective_id) || []
		});
		cascadedRcisByParentWithActions.delete(br.objective_id);
	}

	const cascadedOrphanRcisFinal = Array.from(cascadedRcisByParentWithActions.values()).flat();

	// Get peer-shared objectives (from same-level users, excluding manager and reportees)
	const incomingShares = await getAllIncomingSharedBigRocks(user.uid);
	const reporteeIds = new Set(reportees.map((r) => r.uid));
	const peerShares = incomingShares.filter(
		(s) => !reporteeIds.has(s.from_user_id) && s.from_user_id !== user.manager_id
	);

	// Add action labels to peer shares
	const peerSharesWithActions = peerShares.map((item) => ({
		...item,
		action: computeAction(item, 'Accepted')
	}));

	// Group peer shares (Big Rocks with their child RCIs)
	const peerBigRocks = peerSharesWithActions.filter((s) => s.objective_type === 'big_rock');
	const peerRcis = peerSharesWithActions.filter((s) => s.objective_type === 'risk_critical_initiative');

	const peerRcisByParent = new Map<string | null, typeof peerRcis>();
	for (const rci of peerRcis) {
		const parentId = rci.objective_parent_id;
		if (!peerRcisByParent.has(parentId)) {
			peerRcisByParent.set(parentId, []);
		}
		peerRcisByParent.get(parentId)!.push(rci);
	}

	type PeerShareType = typeof peerSharesWithActions[0];
	const groupedPeerShares: Array<{
		bigRock: PeerShareType;
		rcis: PeerShareType[];
	}> = [];

	for (const br of peerBigRocks) {
		groupedPeerShares.push({
			bigRock: br,
			rcis: peerRcisByParent.get(br.objective_id) || []
		});
		peerRcisByParent.delete(br.objective_id);
	}

	const peerOrphanRcis = Array.from(peerRcisByParent.values()).flat();

	return {
		groupedObjectives,
		orphanRcis,
		objectives,
		reportees,
		user,
		manager,
		needsApproval,
		hasUnapprovedObjectives,
		groupedCascaded: groupedCascadedFinal,
		cascadedOrphanRcis: cascadedOrphanRcisFinal,
		myBigRocks,
		sameLevelUsers,
		groupedPeerShares,
		peerOrphanRcis
	};
};

export const actions: Actions = {
	publish: async ({ locals }) => {
		const user = locals.user!;
		const objectives = await getObjectivesWithReceivedFrom(user.uid);
		const reportees = await getUsersByManager(user.uid);

		if (objectives.length === 0) {
			return fail(400, { error: 'You have no objectives to publish' });
		}

		if (reportees.length === 0) {
			return fail(400, { error: 'You have no reportees to publish to' });
		}

		let totalPublished = 0;

		for (const objective of objectives) {
			// Get reportees who haven't already received this objective
			const alreadySharedWith = await getSharedRecipientIds(objective.id, user.uid);
			const alreadySharedSet = new Set(alreadySharedWith);
			const newReportees = reportees.filter((r) => !alreadySharedSet.has(r.uid));

			if (newReportees.length > 0) {
				const sharedBigRock = await createSharedBigRock({
					objectiveId: objective.id,
					fromUserId: user.uid
				});

				for (const reportee of newReportees) {
					await addSharedBigRockRecipient({
						sharedBigRockId: sharedBigRock.id,
						toUserId: reportee.uid
					});
				}

				totalPublished++;
			}
		}

		if (totalPublished === 0) {
			return fail(400, { error: 'All objectives have already been published to all reportees' });
		}

		return { published: true, objectiveCount: totalPublished, recipientCount: reportees.length };
	},

	requestApproval: async ({ locals }) => {
		const user = locals.user!;

		// Only level 3+ users need to request approval
		if (user.level < 3) {
			return fail(400, { error: 'You do not need to request approval' });
		}

		if (!user.manager_id) {
			return fail(400, { error: 'You do not have a manager assigned' });
		}

		const objectives = await getObjectivesWithReceivedFrom(user.uid);
		const unapprovedObjectives = objectives.filter((o) => !o.approved);

		if (unapprovedObjectives.length === 0) {
			return fail(400, { error: 'All your objectives are already approved' });
		}

		let totalRequested = 0;

		for (const objective of unapprovedObjectives) {
			// Check if already shared with manager
			const alreadySharedWith = await getSharedRecipientIds(objective.id, user.uid);
			if (alreadySharedWith.includes(user.manager_id)) {
				continue; // Already requested approval for this objective
			}

			const sharedBigRock = await createSharedBigRock({
				objectiveId: objective.id,
				fromUserId: user.uid
			});

			await addSharedBigRockRecipient({
				sharedBigRockId: sharedBigRock.id,
				toUserId: user.manager_id
			});

			totalRequested++;
		}

		if (totalRequested === 0) {
			return fail(400, { error: 'Approval has already been requested for all unapproved objectives' });
		}

		return { approvalRequested: true, objectiveCount: totalRequested };
	},

	adoptAsBigRock: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared objective not found' });
		}

		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		const approved = user.level <= 2;

		let strategicPriorityId: string | undefined;
		if (sharedBigRock.objective_type === 'risk_critical_initiative') {
			strategicPriorityId = sharedBigRock.parent_strategic_priority_id || undefined;
		} else {
			strategicPriorityId = sharedBigRock.objective_strategic_priority_id || undefined;
		}

		await createObjective({
			name: sharedBigRock.objective_name,
			type: 'big_rock',
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved
		});

		return { adopted: true };
	},

	adoptAsRci: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const parentId = data.get('parentId')?.toString() || undefined;

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared objective not found' });
		}

		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		const approved = user.level <= 2;

		await createObjective({
			name: sharedBigRock.objective_name,
			type: 'risk_critical_initiative',
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId: sharedBigRock.objective_strategic_priority_id || undefined,
			parentId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved
		});

		return { adopted: true };
	},

	ignoreCascaded: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		await updateRecipientAccepted(recipientId, false);
		return { ignoredCascaded: true };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const objectiveId = data.get('objectiveId')?.toString();

		if (!objectiveId) {
			return fail(400, { error: 'Missing objective ID' });
		}

		const objective = await getObjectiveById(objectiveId);
		if (!objective || objective.owner_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedWith = await getSharedRecipientIds(objectiveId, locals.user!.uid);
		if (sharedWith.length > 0) {
			return fail(400, { error: 'Cannot delete a shared objective' });
		}

		await deleteObjective(objectiveId);
		return { deleted: true };
	},

	share: async ({ request, locals }) => {
		const user = locals.user!;
		const formData = await request.formData();
		const objectiveId = formData.get('objectiveId')?.toString();
		const recipientIds = formData.getAll('recipientIds') as string[];

		if (!objectiveId) {
			return fail(400, { error: 'Missing objective ID' });
		}

		const objective = await getObjectiveById(objectiveId);
		if (!objective || objective.owner_user_id !== user.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const alreadySharedWith = await getSharedRecipientIds(objectiveId, user.uid);
		const alreadySharedSet = new Set(alreadySharedWith);
		const newRecipientIds = recipientIds.filter((id) => !alreadySharedSet.has(id));

		if (newRecipientIds.length === 0) {
			return fail(400, { error: 'Select at least one recipient' });
		}

		const sharedBigRock = await createSharedBigRock({
			objectiveId: objective.id,
			fromUserId: user.uid
		});

		for (const recipientId of newRecipientIds) {
			await addSharedBigRockRecipient({
				sharedBigRockId: sharedBigRock.id,
				toUserId: recipientId
			});
		}

		return { shared: true, recipientCount: newRecipientIds.length };
	},

	assignParent: async ({ request, locals }) => {
		const formData = await request.formData();
		const objectiveId = formData.get('objectiveId')?.toString();
		const parentId = formData.get('parentId')?.toString() || null;

		if (!objectiveId) {
			return fail(400, { error: 'Missing objective ID' });
		}

		const objective = await getObjectiveById(objectiveId);
		if (!objective || objective.owner_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		if (objective.type !== 'risk_critical_initiative') {
			return fail(400, { error: 'Only RCIs can be assigned a parent Big Rock' });
		}

		await updateObjective(objectiveId, { parentId });
		return { parentAssigned: true };
	},

	acceptPeerAsBigRock: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared objective not found' });
		}

		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		let strategicPriorityId: string | undefined;
		if (sharedBigRock.objective_type === 'risk_critical_initiative') {
			strategicPriorityId = sharedBigRock.parent_strategic_priority_id || undefined;
		} else {
			strategicPriorityId = sharedBigRock.objective_strategic_priority_id || undefined;
		}

		await createObjective({
			name: sharedBigRock.objective_name,
			type: 'big_rock',
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved: user.level <= 2
		});

		return { peerAccepted: true };
	},

	acceptPeerAsRci: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const parentId = data.get('parentId')?.toString() || undefined;

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared objective not found' });
		}

		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		await createObjective({
			name: sharedBigRock.objective_name,
			type: 'risk_critical_initiative',
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId: sharedBigRock.objective_strategic_priority_id || undefined,
			parentId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved: user.level <= 2
		});

		return { peerAccepted: true };
	},

	ignorePeer: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		await updateRecipientAccepted(recipientId, false);
		return { peerIgnored: true };
	}
};
