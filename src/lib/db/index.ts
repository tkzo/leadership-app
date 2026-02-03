import { Pool } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';

const pool = new Pool({ connectionString: DATABASE_URL });

// Handle pool errors to prevent crashes on idle connection closure
pool.on('error', (err) => {
	console.error('Database pool error:', err.message);
});

export async function query<T = Record<string, unknown>>(
	text: string,
	params?: unknown[]
): Promise<T[]> {
	const result = await pool.query(text, params);
	return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
	text: string,
	params?: unknown[]
): Promise<T | null> {
	const result = await pool.query(text, params);
	return (result.rows[0] as T) || null;
}

export async function execute(text: string, params?: unknown[]): Promise<number> {
	const result = await pool.query(text, params);
	return result.rowCount ?? 0;
}

export { pool };
