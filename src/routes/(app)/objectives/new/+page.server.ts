import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createObjective, getObjectivesByOwnerAndType } from '$lib/db/queries/objectives';
import { getAllStrategicPriorities } from '$lib/db/queries/strategic-priorities';

export const load: PageServerLoad = async ({ locals }) => {
	const priorities = await getAllStrategicPriorities();
	const bigRocks = await getObjectivesByOwnerAndType(locals.user!.uid, 'big_rock');
	return { priorities, bigRocks };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const type = data.get('type')?.toString() as 'big_rock' | 'risk_critical_initiative';
		const description = data.get('description')?.toString();
		const metric = data.get('metric')?.toString();
		const strategicPriorityId = data.get('strategicPriorityId')?.toString() || undefined;
		const parentId = data.get('parentId')?.toString() || undefined;

		if (!name || !type) {
			return fail(400, { error: 'Name and type are required' });
		}

		if (type !== 'big_rock' && type !== 'risk_critical_initiative') {
			return fail(400, { error: 'Invalid objective type' });
		}

		const user = locals.user!;

		// Auto-approve for level 1 and 2 users
		const approved = user.level <= 2;

		const objective = await createObjective({
			name,
			type,
			description,
			metric,
			strategicPriorityId,
			parentId,
			ownerUserId: user.uid,
			approved
		});

		throw redirect(303, `/objectives/${objective.id}`);
	}
};
