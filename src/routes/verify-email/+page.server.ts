import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getUserByVerificationToken, verifyUserEmail } from '$lib/db/queries/users';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const pending = url.searchParams.get('pending');

	if (pending) {
		return { pending: true };
	}

	if (!token) {
		return { error: 'No verification token provided' };
	}

	const user = await getUserByVerificationToken(token);
	if (!user) {
		return { error: 'Invalid or expired verification token' };
	}

	await verifyUserEmail(user.uid);

	throw redirect(303, '/login?verified=true');
};
