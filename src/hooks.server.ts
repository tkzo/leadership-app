import type { Handle } from '@sveltejs/kit';
import { getUserFromSession } from '$lib/auth/session';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionData = await getUserFromSession(event.cookies);

	if (sessionData) {
		event.locals.user = sessionData.user;
		event.locals.session = sessionData.session;
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};
