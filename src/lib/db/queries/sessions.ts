import { queryOne, execute } from '../index';
import type { Session, User } from '$lib/types';

const SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000; // 2 weeks

export async function createSession(userId: string): Promise<Session> {
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
	const result = await queryOne<Session>(
		`INSERT INTO sessions (user_id, expires_at)
		 VALUES ($1, $2)
		 RETURNING *`,
		[userId, expiresAt]
	);
	return result!;
}

interface SessionQueryResult extends User {
	session_id: string;
	session_user_id: string;
	session_expires_at: Date;
	session_created_at: Date;
}

export async function validateSession(
	sessionId: string
): Promise<{ session: Session; user: User } | null> {
	const result = await queryOne<SessionQueryResult>(
		`SELECT
			s.id as session_id,
			s.user_id as session_user_id,
			s.expires_at as session_expires_at,
			s.created_at as session_created_at,
			u.*
		 FROM sessions s
		 JOIN users u ON s.user_id = u.uid
		 WHERE s.id = $1 AND s.expires_at > NOW()`,
		[sessionId]
	);

	if (!result) return null;

	const session: Session = {
		id: result.session_id,
		user_id: result.session_user_id,
		expires_at: result.session_expires_at,
		created_at: result.session_created_at
	};

	const user: User = {
		uid: result.uid,
		name: result.name,
		title: result.title,
		level: result.level,
		manager_id: result.manager_id,
		admin: result.admin,
		email: result.email,
		password_hash: result.password_hash,
		email_verified: result.email_verified,
		verification_token: result.verification_token,
		reset_token: result.reset_token,
		reset_token_expires: result.reset_token_expires,
		created_at: result.created_at
	};

	return { session, user };
}

export async function deleteSession(sessionId: string): Promise<void> {
	await execute('DELETE FROM sessions WHERE id = $1', [sessionId]);
}

export async function deleteUserSessions(userId: string): Promise<void> {
	await execute('DELETE FROM sessions WHERE user_id = $1', [userId]);
}

export async function cleanupExpiredSessions(): Promise<number> {
	return execute('DELETE FROM sessions WHERE expires_at < NOW()');
}
