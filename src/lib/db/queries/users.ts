import { query, queryOne, execute } from '../index';
import type { User } from '$lib/types';

export async function getUserById(uid: string): Promise<User | null> {
	return queryOne<User>('SELECT * FROM users WHERE uid = $1', [uid]);
}

export async function getUserByEmail(email: string): Promise<User | null> {
	return queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
}

export async function getUserByVerificationToken(token: string): Promise<User | null> {
	return queryOne<User>('SELECT * FROM users WHERE verification_token = $1', [token]);
}

export async function getUserByResetToken(token: string): Promise<User | null> {
	return queryOne<User>(
		'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
		[token]
	);
}

export async function getAllUsers(): Promise<User[]> {
	return query<User>('SELECT * FROM users ORDER BY created_at DESC');
}

export async function getUsersByLevel(level: number): Promise<User[]> {
	return query<User>('SELECT * FROM users WHERE level = $1 ORDER BY name', [level]);
}

export async function getUsersByManager(managerId: string): Promise<User[]> {
	return query<User>('SELECT * FROM users WHERE manager_id = $1 ORDER BY name', [managerId]);
}

export async function createUser(data: {
	name: string;
	email: string;
	passwordHash: string;
	title?: string;
	level?: number;
	managerId?: string;
	admin?: boolean;
	verificationToken?: string;
}): Promise<User> {
	const result = await queryOne<User>(
		`INSERT INTO users (name, email, password_hash, title, level, manager_id, admin, verification_token)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		 RETURNING *`,
		[
			data.name,
			data.email,
			data.passwordHash,
			data.title || null,
			data.level || 1,
			data.managerId || null,
			data.admin || false,
			data.verificationToken || null
		]
	);
	return result!;
}

export async function updateUser(
	uid: string,
	data: Partial<{
		name: string;
		email: string;
		title: string;
		level: number;
		managerId: string | null;
		admin: boolean;
	}>
): Promise<User | null> {
	const fields: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		fields.push(`name = $${paramIndex++}`);
		values.push(data.name);
	}
	if (data.email !== undefined) {
		fields.push(`email = $${paramIndex++}`);
		values.push(data.email);
	}
	if (data.title !== undefined) {
		fields.push(`title = $${paramIndex++}`);
		values.push(data.title);
	}
	if (data.level !== undefined) {
		fields.push(`level = $${paramIndex++}`);
		values.push(data.level);
	}
	if (data.managerId !== undefined) {
		fields.push(`manager_id = $${paramIndex++}`);
		values.push(data.managerId);
	}
	if (data.admin !== undefined) {
		fields.push(`admin = $${paramIndex++}`);
		values.push(data.admin);
	}

	if (fields.length === 0) return getUserById(uid);

	values.push(uid);
	return queryOne<User>(
		`UPDATE users SET ${fields.join(', ')} WHERE uid = $${paramIndex} RETURNING *`,
		values
	);
}

export async function verifyUserEmail(uid: string): Promise<void> {
	await execute(
		'UPDATE users SET email_verified = TRUE, verification_token = NULL WHERE uid = $1',
		[uid]
	);
}

export async function setVerificationToken(uid: string, token: string): Promise<void> {
	await execute('UPDATE users SET verification_token = $1 WHERE uid = $2', [token, uid]);
}

export async function setResetToken(uid: string, token: string, expires: Date): Promise<void> {
	await execute('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE uid = $3', [
		token,
		expires,
		uid
	]);
}

export async function updatePassword(uid: string, passwordHash: string): Promise<void> {
	await execute(
		'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE uid = $2',
		[passwordHash, uid]
	);
}

export async function deleteUser(uid: string): Promise<boolean> {
	const count = await execute('DELETE FROM users WHERE uid = $1', [uid]);
	return count > 0;
}

export async function getAllReporteesRecursive(managerId: string): Promise<User[]> {
	return query<User>(
		`WITH RECURSIVE reportee_tree AS (
			SELECT * FROM users WHERE manager_id = $1
			UNION ALL
			SELECT u.* FROM users u
			INNER JOIN reportee_tree rt ON u.manager_id = rt.uid
		)
		SELECT * FROM reportee_tree ORDER BY level, name`,
		[managerId]
	);
}

export async function hasReportees(managerId: string): Promise<boolean> {
	const result = await queryOne<{ count: string }>(
		'SELECT COUNT(*) as count FROM users WHERE manager_id = $1',
		[managerId]
	);
	return result ? parseInt(result.count) > 0 : false;
}
