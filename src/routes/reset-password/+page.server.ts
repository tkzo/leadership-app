import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserByResetToken, updatePassword } from '$lib/db/queries/users';
import { hashPassword } from '$lib/auth/password';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { error: 'No reset token provided' };
	}

	const user = await getUserByResetToken(token);
	if (!user) {
		return { error: 'Invalid or expired reset token' };
	}

	return { token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = data.get('token')?.toString();
		const password = data.get('password')?.toString();
		const confirmPassword = data.get('confirmPassword')?.toString();

		if (!token) {
			return fail(400, { error: 'Reset token is required' });
		}

		if (!password || !confirmPassword) {
			return fail(400, { error: 'Password is required', token });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match', token });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters', token });
		}

		const user = await getUserByResetToken(token);
		if (!user) {
			return fail(400, { error: 'Invalid or expired reset token' });
		}

		const passwordHash = await hashPassword(password);
		await updatePassword(user.uid, passwordHash);

		throw redirect(303, '/login?reset=true');
	}
};
