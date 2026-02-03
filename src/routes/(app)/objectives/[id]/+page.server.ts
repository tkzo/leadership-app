import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getObjectiveById,
	updateObjective,
	deleteObjective,
	getObjectivesByOwnerAndType
} from '$lib/db/queries/objectives';
import { getAllStrategicPriorities } from '$lib/db/queries/strategic-priorities';
import { getUsersByLevel } from '$lib/db/queries/users';
import {
	createSharedBigRock,
	addSharedBigRockRecipient,
	getSharedRecipientIds
} from '$lib/db/queries/shared-big-rocks';

export const load: PageServerLoad = async ({ params, locals }) => {
	const objective = await getObjectiveById(params.id);

	if (!objective) {
		throw error(404, 'Objective not found');
	}

	if (objective.owner_user_id !== locals.user!.uid) {
		throw error(403, 'You do not have permission to view this objective');
	}

	const priorities = await getAllStrategicPriorities();
	const bigRocks = await getObjectivesByOwnerAndType(locals.user!.uid, 'big_rock');

	// Get users who have already received this objective
	const alreadySharedWith = await getSharedRecipientIds(objective.id, locals.user!.uid);
	const alreadySharedSet = new Set(alreadySharedWith);
	const isLocked = alreadySharedWith.length > 0;

	// For sharing (same level users, exclude self and those already shared with)
	const allSameLevelUsers = await getUsersByLevel(locals.user!.level);
	const sameLevelUsers = allSameLevelUsers.filter(
		(u) => u.uid !== locals.user!.uid && !alreadySharedSet.has(u.uid)
	);

	return {
		objective,
		priorities,
		bigRocks: bigRocks.filter((br) => br.id !== objective.id),
		sameLevelUsers,
		isLocked,
		user: locals.user!
	};
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const objective = await getObjectiveById(params.id);

		if (!objective || objective.owner_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		if (objective.approved) {
			return fail(403, { error: 'Cannot edit approved objective' });
		}

		// Check if locked (has been shared/published)
		const alreadySharedWith = await getSharedRecipientIds(objective.id, locals.user!.uid);
		if (alreadySharedWith.length > 0) {
			return fail(403, { error: 'Cannot edit objective that has been shared or published' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const type = data.get('type')?.toString() as 'big_rock' | 'risk_critical_initiative';
		const description = data.get('description')?.toString();
		const metric = data.get('metric')?.toString();
		const strategicPriorityId = data.get('strategicPriorityId')?.toString() || null;
		const parentId = data.get('parentId')?.toString() || null;

		if (!name || !type) {
			return fail(400, { error: 'Name and type are required' });
		}

		await updateObjective(params.id, {
			name,
			type,
			description,
			metric,
			strategicPriorityId,
			parentId
		});

		return { success: true };
	},

	delete: async ({ params, locals }) => {
		const objective = await getObjectiveById(params.id);

		if (!objective || objective.owner_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		// Check if locked (has been shared/published)
		const alreadySharedWith = await getSharedRecipientIds(objective.id, locals.user!.uid);
		if (alreadySharedWith.length > 0) {
			return fail(403, { error: 'Cannot delete objective that has been shared or published' });
		}

		await deleteObjective(params.id);
		throw redirect(303, '/objectives');
	},

	share: async ({ request, params, locals }) => {
		const user = locals.user!;
		const objective = await getObjectiveById(params.id);

		if (!objective || objective.owner_user_id !== user.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const formData = await request.formData();
		const recipientIds = formData.getAll('recipientIds') as string[];

		// Filter out users who have already received this objective
		const alreadySharedWith = await getSharedRecipientIds(objective.id, user.uid);
		const alreadySharedSet = new Set(alreadySharedWith);
		const newRecipientIds = recipientIds.filter((id) => !alreadySharedSet.has(id));

		if (newRecipientIds.length === 0) {
			return fail(400, { error: 'Select at least one recipient (or all selected have already received this objective)' });
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
	}
};
