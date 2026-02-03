import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getObjectivesWithReceivedFrom } from '$lib/db/queries/objectives';
import { getAllStrategicPriorities } from '$lib/db/queries/strategic-priorities';
import {
	getOutgoingSharesByUser,
	createSharedBigRock,
	addSharedBigRockRecipient,
	getSharedRecipientIds,
	getIncomingSharesFromManager
} from '$lib/db/queries/shared-big-rocks';
import { getUsersByManager, getUserById } from '$lib/db/queries/users';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const objectives = await getObjectivesWithReceivedFrom(user.uid);
	const priorities = await getAllStrategicPriorities();
	const outgoingShares = await getOutgoingSharesByUser(user.uid);
	const reportees = await getUsersByManager(user.uid);

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

	// Group cascaded objectives (Big Rocks with their child RCIs)
	const cascadedBigRocks = cascadedFromManager.filter((o) => o.objective_type === 'big_rock');
	const cascadedRcis = cascadedFromManager.filter((o) => o.objective_type === 'risk_critical_initiative');

	const cascadedRcisByParent = new Map<string | null, typeof cascadedRcis>();
	for (const rci of cascadedRcis) {
		const parentId = rci.objective_parent_id;
		if (!cascadedRcisByParent.has(parentId)) {
			cascadedRcisByParent.set(parentId, []);
		}
		cascadedRcisByParent.get(parentId)!.push(rci);
	}

	type CascadedType = typeof cascadedFromManager[0];
	const groupedCascaded: Array<{
		bigRock: CascadedType;
		rcis: CascadedType[];
	}> = [];

	for (const br of cascadedBigRocks) {
		groupedCascaded.push({
			bigRock: br,
			rcis: cascadedRcisByParent.get(br.objective_id) || []
		});
		cascadedRcisByParent.delete(br.objective_id);
	}

	const cascadedOrphanRcis = Array.from(cascadedRcisByParent.values()).flat();

	return {
		groupedObjectives,
		orphanRcis,
		objectives,
		reportees,
		user,
		manager,
		needsApproval,
		hasUnapprovedObjectives,
		groupedCascaded,
		cascadedOrphanRcis
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
	}
};
