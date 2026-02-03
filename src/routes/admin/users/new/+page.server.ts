import { fail, redirect, isRedirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { createUser, getAllUsers } from '$lib/db/queries/users';
import { hashPassword } from '$lib/auth/password';
import { sendVerificationEmail } from '$lib/email';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async () => {
	const users = await getAllUsers();
	return { managers: users };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const title = data.get('title')?.toString();
		const level = parseInt(data.get('level')?.toString() || '1');
		const managerId = data.get('managerId')?.toString() || undefined;
		const admin = data.get('admin') === 'on';

		if (!name || !email || !password) {
			return fail(400, { error: 'Name, email, and password are required' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters' });
		}

		try {
			const passwordHash = await hashPassword(password);
			const verificationToken = uuidv4();

			await createUser({
				name,
				email,
				passwordHash,
				title,
				level,
				managerId: managerId || undefined,
				admin,
				verificationToken
			});

			// Try to send verification email, but don't fail if it doesn't work
			try {
				await sendVerificationEmail(email, verificationToken);
			} catch (emailError) {
				console.error('Failed to send verification email:', emailError);
			}

			throw redirect(303, '/admin/users');
		} catch (e) {
			if (isRedirect(e)) throw e;
			console.error('User creation error:', e);
			const message = e instanceof Error ? e.message : 'Unknown error';
			return fail(400, { error: `Failed to create user: ${message}` });
		}
	}
};
