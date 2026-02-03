import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getUserByEmail, setResetToken } from '$lib/db/queries/users';
import { sendPasswordResetEmail } from '$lib/email';
import { v4 as uuidv4 } from 'uuid';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		return { loggedIn: true };
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		const user = await getUserByEmail(email);

		// Always show success to prevent email enumeration
		if (!user) {
			return { success: true };
		}

		const token = uuidv4();
		const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

		await setResetToken(user.uid, token, expires);
		await sendPasswordResetEmail(email, token);

		return { success: true };
	}
};
