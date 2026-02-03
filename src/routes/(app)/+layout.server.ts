import type { LayoutServerLoad } from './$types';
import { requireEmailVerified } from '$lib/auth/guards';
import { hasReportees } from '$lib/db/queries/users';

export const load: LayoutServerLoad = async ({ locals }) => {
	requireEmailVerified(locals.user);
	const userHasReportees = await hasReportees(locals.user!.uid);
	return { user: locals.user, hasReportees: userHasReportees };
};
