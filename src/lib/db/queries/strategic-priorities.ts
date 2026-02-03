import { query, queryOne, execute } from '../index';
import type { StrategicPriority } from '$lib/types';

export async function getAllStrategicPriorities(): Promise<StrategicPriority[]> {
	return query<StrategicPriority>('SELECT * FROM strategic_priorities ORDER BY name');
}

export async function getStrategicPriorityById(id: string): Promise<StrategicPriority | null> {
	return queryOne<StrategicPriority>('SELECT * FROM strategic_priorities WHERE id = $1', [id]);
}

export async function createStrategicPriority(data: {
	name: string;
	description?: string;
}): Promise<StrategicPriority> {
	const result = await queryOne<StrategicPriority>(
		`INSERT INTO strategic_priorities (name, description)
		 VALUES ($1, $2)
		 RETURNING *`,
		[data.name, data.description || null]
	);
	return result!;
}

export async function updateStrategicPriority(
	id: string,
	data: Partial<{ name: string; description: string }>
): Promise<StrategicPriority | null> {
	const fields: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		fields.push(`name = $${paramIndex++}`);
		values.push(data.name);
	}
	if (data.description !== undefined) {
		fields.push(`description = $${paramIndex++}`);
		values.push(data.description);
	}

	if (fields.length === 0) return getStrategicPriorityById(id);

	values.push(id);
	return queryOne<StrategicPriority>(
		`UPDATE strategic_priorities SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
		values
	);
}

export async function deleteStrategicPriority(id: string): Promise<boolean> {
	const count = await execute('DELETE FROM strategic_priorities WHERE id = $1', [id]);
	return count > 0;
}
