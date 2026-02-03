import { createSession, validateSession, deleteSession } from '$lib/db/queries/sessions';
import type { Cookies } from '@sveltejs/kit';
import type { Session, User } from '$lib/types';

const SESSION_COOKIE_NAME = 'session';
const SESSION_COOKIE_OPTIONS = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: process.env.NODE_ENV === 'production',
	maxAge: 60 * 60 * 24 * 14 // 2 weeks
};

export async function createUserSession(
	userId: string,
	cookies: Cookies
): Promise<Session> {
	const session = await createSession(userId);
	cookies.set(SESSION_COOKIE_NAME, session.id, SESSION_COOKIE_OPTIONS);
	return session;
}

export async function getUserFromSession(
	cookies: Cookies
): Promise<{ session: Session; user: User } | null> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (!sessionId) return null;
	return validateSession(sessionId);
}

export async function destroySession(cookies: Cookies): Promise<void> {
	const sessionId = cookies.get(SESSION_COOKIE_NAME);
	if (sessionId) {
		await deleteSession(sessionId);
	}
	cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
}
