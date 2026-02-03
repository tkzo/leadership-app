import type { LayoutServerLoad } from './$types';
import { requireAdmin } from '$lib/auth/guards';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireAdmin(locals.user);
	return { user: locals.user };
};
