import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { destroySession } from '$lib/auth/session';

export const load: PageServerLoad = async () => {
	throw redirect(303, '/login');
};

export const actions: Actions = {
	default: async ({ cookies }) => {
		await destroySession(cookies);
		throw redirect(303, '/login');
	}
};
