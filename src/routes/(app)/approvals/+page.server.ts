import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getPendingApprovalsWithDetails,
	approveObjective,
	rejectObjective,
	getObjectiveById,
	createObjective
} from '$lib/db/queries/objectives';
import { getUserById } from '$lib/db/queries/users';

export const load: PageServerLoad = async ({ locals }) => {
	const pendingApprovals = await getPendingApprovalsWithDetails(locals.user!.uid);

	// Separate big rocks and RCIs
	const bigRocks = pendingApprovals.filter((o) => o.type === 'big_rock');
	const rcis = pendingApprovals.filter((o) => o.type === 'risk_critical_initiative');

	// Group RCIs by their parent big rock
	const rcisByParent = new Map<string | null, typeof rcis>();
	for (const rci of rcis) {
		const parentId = rci.parent_id;
		if (!rcisByParent.has(parentId)) {
			rcisByParent.set(parentId, []);
		}
		rcisByParent.get(parentId)!.push(rci);
	}

	// Build grouped data structure
	type ApprovalType = typeof pendingApprovals[0];
	const groupedApprovals: Array<{
		bigRock: ApprovalType;
		rcis: ApprovalType[];
	}> = [];

	// Add Big Rocks with their child RCIs
	for (const br of bigRocks) {
		groupedApprovals.push({
			bigRock: br,
			rcis: rcisByParent.get(br.id) || []
		});
		rcisByParent.delete(br.id);
	}

	// Orphan RCIs (parent Big Rock not in the pending list)
	const orphanRcis = Array.from(rcisByParent.values()).flat();

	return { pendingApprovals, groupedApprovals, orphanRcis };
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		const data = await request.formData();
		const objectiveId = data.get('objectiveId')?.toString();
		const comments = data.get('comments')?.toString();
		const adopt = data.get('adopt') === 'on';

		if (!objectiveId) {
			return fail(400, { error: 'Missing objective ID' });
		}

		const objective = await getObjectiveById(objectiveId);
		if (!objective) {
			return fail(404, { error: 'Objective not found' });
		}

		// Verify the current user is the manager of the objective owner
		const owner = await getUserById(objective.owner_user_id);
		if (!owner || owner.manager_id !== locals.user!.uid) {
			return fail(403, { error: 'You are not authorized to approve this objective' });
		}

		// Approve the objective
		await approveObjective(objectiveId, comments || undefined);

		// If adopt checkbox is checked, create a copy for the manager
		if (adopt) {
			const manager = locals.user!;
			await createObjective({
				name: objective.name,
				type: objective.type,
				description: objective.description || undefined,
				metric: objective.metric || undefined,
				strategicPriorityId: objective.strategic_priority_id || undefined,
				parentId: objective.parent_id || undefined,
				ownerUserId: manager.uid,
				approved: manager.level <= 2
			});
		}

		return { approved: true, adopted: adopt };
	},

	reject: async ({ request, locals }) => {
		const data = await request.formData();
		const objectiveId = data.get('objectiveId')?.toString();
		const comments = data.get('comments')?.toString();

		if (!objectiveId) {
			return fail(400, { error: 'Missing objective ID' });
		}

		const objective = await getObjectiveById(objectiveId);
		if (!objective) {
			return fail(404, { error: 'Objective not found' });
		}

		// Verify the current user is the manager of the objective owner
		const owner = await getUserById(objective.owner_user_id);
		if (!owner || owner.manager_id !== locals.user!.uid) {
			return fail(403, { error: 'You are not authorized to reject this objective' });
		}

		// Reject the objective (adds comments and marks as rejected)
		await rejectObjective(objectiveId, comments || undefined);

		return { rejected: true };
	}
};
