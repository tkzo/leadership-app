import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getAllStrategicPriorities,
	createStrategicPriority,
	updateStrategicPriority,
	deleteStrategicPriority
} from '$lib/db/queries/strategic-priorities';

export const load: PageServerLoad = async () => {
	const priorities = await getAllStrategicPriorities();
	return { priorities };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		await createStrategicPriority({ name, description });
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();

		if (!id || !name) {
			return fail(400, { error: 'ID and name are required' });
		}

		await updateStrategicPriority(id, { name, description });
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id')?.toString();

		if (!id) {
			return fail(400, { error: 'ID is required' });
		}

		await deleteStrategicPriority(id);
		return { success: true };
	}
};
