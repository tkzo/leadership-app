import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserByEmail } from '$lib/db/queries/users';
import { verifyPassword } from '$lib/auth/password';
import { createUserSession } from '$lib/auth/session';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/');
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const user = await getUserByEmail(email);
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		const validPassword = await verifyPassword(password, user.password_hash);
		if (!validPassword) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		if (!user.email_verified) {
			return fail(400, {
				error: 'Please verify your email before logging in',
				email,
				needsVerification: true
			});
		}

		await createUserSession(user.uid, cookies);
		throw redirect(303, '/');
	}
};
