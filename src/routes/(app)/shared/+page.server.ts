import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getIncomingSharedBigRocks,
	getSharedBigRockRecipient,
	updateRecipientAccepted,
	getSharedBigRockWithObjective
} from '$lib/db/queries/shared-big-rocks';
import {
	createObjective,
	getObjectivesByOwnerAndType,
	getObjectiveById,
	approveObjective,
	rejectObjective
} from '$lib/db/queries/objectives';
import { getUsersByManager } from '$lib/db/queries/users';

function groupShares<T extends { objective_type: string; objective_id: string; objective_parent_id: string | null }>(
	shares: T[]
): { grouped: Array<{ bigRock: T; rcis: T[] }>; orphanRcis: T[] } {
	const bigRocks = shares.filter((s) => s.objective_type === 'big_rock');
	const rcis = shares.filter((s) => s.objective_type === 'risk_critical_initiative');

	const rcisByParent = new Map<string | null, T[]>();
	for (const rci of rcis) {
		const parentId = rci.objective_parent_id;
		if (!rcisByParent.has(parentId)) {
			rcisByParent.set(parentId, []);
		}
		rcisByParent.get(parentId)!.push(rci);
	}

	const grouped: Array<{ bigRock: T; rcis: T[] }> = [];
	for (const br of bigRocks) {
		grouped.push({
			bigRock: br,
			rcis: rcisByParent.get(br.objective_id) || []
		});
		rcisByParent.delete(br.objective_id);
	}

	const orphanRcis = Array.from(rcisByParent.values()).flat();
	return { grouped, orphanRcis };
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	const incomingShares = await getIncomingSharedBigRocks(user.uid);
	const myBigRocks = await getObjectivesByOwnerAndType(user.uid, 'big_rock');
	const directReports = await getUsersByManager(user.uid);
	const directReportIds = new Set(directReports.map((r) => r.uid));

	// Separate: cascaded up from reports (for approval), cascaded down from manager (excluded), and peer shares
	const cascadedUpShares = incomingShares.filter((s) => directReportIds.has(s.from_user_id));
	const regularShares = incomingShares.filter(
		(s) => !directReportIds.has(s.from_user_id) && s.from_user_id !== user.manager_id
	);

	const { grouped: groupedShares, orphanRcis } = groupShares(regularShares);
	const { grouped: groupedCascadedUp, orphanRcis: cascadedUpOrphanRcis } =
		groupShares(cascadedUpShares);

	return {
		incomingShares: regularShares,
		groupedShares,
		orphanRcis,
		myBigRocks,
		groupedCascadedUp,
		cascadedUpOrphanRcis
	};
};

export const actions: Actions = {
	accept: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const type = data.get('type')?.toString() as 'big_rock' | 'risk_critical_initiative';
		const parentId = data.get('parentId')?.toString() || undefined;

		if (!recipientId || !type) {
			return fail(400, { error: 'Missing required fields' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared big rock not found' });
		}

		// Mark as accepted
		await updateRecipientAccepted(recipientId, true);

		// Create new objective for the accepting user
		const user = locals.user!;
		const approved = user.level <= 2;

		// Determine strategic priority:
		// - If accepting an RCI as a Big Rock, use the parent's strategic priority
		// - Otherwise, use the objective's own strategic priority
		let strategicPriorityId: string | undefined;
		if (type === 'big_rock' && sharedBigRock.objective_type === 'risk_critical_initiative') {
			strategicPriorityId = sharedBigRock.parent_strategic_priority_id || undefined;
		} else {
			strategicPriorityId = sharedBigRock.objective_strategic_priority_id || undefined;
		}

		await createObjective({
			name: sharedBigRock.objective_name,
			type,
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId,
			parentId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved
		});

		return { accepted: true };
	},

	ignore: async ({ request, locals }) => {
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
		return { ignored: true };
	},

	approve: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const comments = data.get('comments')?.toString() || undefined;

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

		const objective = await getObjectiveById(sharedBigRock.objective_id);
		if (!objective) {
			return fail(404, { error: 'Objective not found' });
		}

		await approveObjective(objective.id, comments);
		await updateRecipientAccepted(recipientId, true);

		return { approvedObjective: true };
	},

	approveAndAdoptAsBigRock: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const comments = data.get('comments')?.toString() || undefined;

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

		const objective = await getObjectiveById(sharedBigRock.objective_id);
		if (!objective) {
			return fail(404, { error: 'Objective not found' });
		}

		await approveObjective(objective.id, comments);
		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		let strategicPriorityId: string | undefined;
		if (objective.type === 'risk_critical_initiative') {
			strategicPriorityId = sharedBigRock.parent_strategic_priority_id || undefined;
		} else {
			strategicPriorityId = objective.strategic_priority_id || undefined;
		}

		await createObjective({
			name: objective.name,
			type: 'big_rock',
			description: objective.description || undefined,
			metric: objective.metric || undefined,
			strategicPriorityId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved: user.level <= 2
		});

		return { approvedObjective: true, adopted: true };
	},

	approveAndAdoptAsRci: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const comments = data.get('comments')?.toString() || undefined;
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

		const objective = await getObjectiveById(sharedBigRock.objective_id);
		if (!objective) {
			return fail(404, { error: 'Objective not found' });
		}

		await approveObjective(objective.id, comments);
		await updateRecipientAccepted(recipientId, true);

		const user = locals.user!;
		await createObjective({
			name: objective.name,
			type: 'risk_critical_initiative',
			description: objective.description || undefined,
			metric: objective.metric || undefined,
			strategicPriorityId: objective.strategic_priority_id || undefined,
			parentId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved: user.level <= 2
		});

		return { approvedObjective: true, adopted: true };
	},

	reject: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const comments = data.get('comments')?.toString() || undefined;

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

		await rejectObjective(sharedBigRock.objective_id, comments);
		await updateRecipientAccepted(recipientId, false);

		return { rejectedObjective: true };
	}
};
