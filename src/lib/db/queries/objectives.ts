import { query, queryOne, execute } from '../index';
import type { Objective } from '$lib/types';

export async function getObjectiveById(id: string): Promise<Objective | null> {
	return queryOne<Objective>('SELECT * FROM objectives WHERE id = $1', [id]);
}

export async function getObjectivesByOwner(ownerUserId: string): Promise<Objective[]> {
	return query<Objective>(
		'SELECT * FROM objectives WHERE owner_user_id = $1 ORDER BY created_at DESC',
		[ownerUserId]
	);
}

export async function getObjectivesWithReceivedFrom(ownerUserId: string): Promise<
	Array<
		Objective & {
			received_from_name: string | null;
			received_from_title: string | null;
			parent_name: string | null;
			strategic_priority_name: string | null;
		}
	>
> {
	return query(
		`SELECT o.*,
			u.name as received_from_name,
			u.title as received_from_title,
			parent.name as parent_name,
			sp.name as strategic_priority_name
		 FROM objectives o
		 LEFT JOIN users u ON o.received_from_user_id = u.uid
		 LEFT JOIN objectives parent ON o.parent_id = parent.id
		 LEFT JOIN strategic_priorities sp ON o.strategic_priority_id = sp.id
		 WHERE o.owner_user_id = $1
		 ORDER BY o.type DESC, o.created_at DESC`,
		[ownerUserId]
	);
}

export async function getObjectivesByOwnerAndType(
	ownerUserId: string,
	type: 'big_rock' | 'risk_critical_initiative'
): Promise<Objective[]> {
	return query<Objective>(
		'SELECT * FROM objectives WHERE owner_user_id = $1 AND type = $2 ORDER BY created_at DESC',
		[ownerUserId, type]
	);
}

export async function getPendingApprovals(managerId: string): Promise<Objective[]> {
	return query<Objective>(
		`SELECT o.* FROM objectives o
		 JOIN users u ON o.owner_user_id = u.uid
		 WHERE u.manager_id = $1 AND o.approved = FALSE
		 ORDER BY o.created_at DESC`,
		[managerId]
	);
}

export async function getPendingApprovalsWithDetails(managerId: string): Promise<
	Array<
		Objective & {
			owner_name: string;
			owner_title: string | null;
			strategic_priority_name: string | null;
			parent_name: string | null;
		}
	>
> {
	return query(
		`SELECT o.*,
			u.name as owner_name,
			u.title as owner_title,
			sp.name as strategic_priority_name,
			parent.name as parent_name
		 FROM objectives o
		 JOIN users u ON o.owner_user_id = u.uid
		 LEFT JOIN strategic_priorities sp ON o.strategic_priority_id = sp.id
		 LEFT JOIN objectives parent ON o.parent_id = parent.id
		 WHERE u.manager_id = $1 AND o.approved = FALSE AND o.rejected = FALSE
		 ORDER BY o.type DESC, o.created_at DESC`,
		[managerId]
	);
}

export async function createObjective(data: {
	name: string;
	type: 'big_rock' | 'risk_critical_initiative';
	description?: string;
	metric?: string;
	strategicPriorityId?: string;
	parentId?: string;
	ownerUserId: string;
	receivedFromUserId?: string;
	approved?: boolean;
}): Promise<Objective> {
	const result = await queryOne<Objective>(
		`INSERT INTO objectives (name, type, description, metric, strategic_priority_id, parent_id, owner_user_id, received_from_user_id, approved)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		 RETURNING *`,
		[
			data.name,
			data.type,
			data.description || null,
			data.metric || null,
			data.strategicPriorityId || null,
			data.parentId || null,
			data.ownerUserId,
			data.receivedFromUserId || null,
			data.approved ?? false
		]
	);
	return result!;
}

export async function updateObjective(
	id: string,
	data: Partial<{
		name: string;
		type: 'big_rock' | 'risk_critical_initiative';
		description: string;
		metric: string;
		strategicPriorityId: string | null;
		parentId: string | null;
		comments: string;
	}>
): Promise<Objective | null> {
	const fields: string[] = [];
	const values: unknown[] = [];
	let paramIndex = 1;

	if (data.name !== undefined) {
		fields.push(`name = $${paramIndex++}`);
		values.push(data.name);
	}
	if (data.type !== undefined) {
		fields.push(`type = $${paramIndex++}`);
		values.push(data.type);
	}
	if (data.description !== undefined) {
		fields.push(`description = $${paramIndex++}`);
		values.push(data.description);
	}
	if (data.metric !== undefined) {
		fields.push(`metric = $${paramIndex++}`);
		values.push(data.metric);
	}
	if (data.strategicPriorityId !== undefined) {
		fields.push(`strategic_priority_id = $${paramIndex++}`);
		values.push(data.strategicPriorityId);
	}
	if (data.parentId !== undefined) {
		fields.push(`parent_id = $${paramIndex++}`);
		values.push(data.parentId);
	}
	if (data.comments !== undefined) {
		fields.push(`comments = $${paramIndex++}`);
		values.push(data.comments);
	}

	if (fields.length === 0) return getObjectiveById(id);

	values.push(id);
	return queryOne<Objective>(
		`UPDATE objectives SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
		values
	);
}

export async function approveObjective(id: string, comments?: string): Promise<Objective | null> {
	if (comments) {
		return queryOne<Objective>(
			'UPDATE objectives SET approved = TRUE, comments = $1 WHERE id = $2 RETURNING *',
			[comments, id]
		);
	}
	return queryOne<Objective>(
		'UPDATE objectives SET approved = TRUE WHERE id = $1 RETURNING *',
		[id]
	);
}

export async function rejectObjective(id: string, comments?: string): Promise<Objective | null> {
	if (comments) {
		return queryOne<Objective>(
			'UPDATE objectives SET rejected = TRUE, comments = $1 WHERE id = $2 RETURNING *',
			[comments, id]
		);
	}
	return queryOne<Objective>(
		'UPDATE objectives SET rejected = TRUE WHERE id = $1 RETURNING *',
		[id]
	);
}

export async function deleteObjective(id: string): Promise<boolean> {
	const count = await execute('DELETE FROM objectives WHERE id = $1', [id]);
	return count > 0;
}

export async function getTeamObjectives(managerId: string): Promise<
	Array<{
		id: string;
		name: string;
		type: 'big_rock' | 'risk_critical_initiative';
		description: string | null;
		metric: string | null;
		strategic_priority_id: string | null;
		strategic_priority_name: string | null;
		parent_id: string | null;
		parent_name: string | null;
		approved: boolean;
		owner_user_id: string;
		owner_name: string;
		owner_title: string | null;
		owner_level: number;
		created_at: Date;
	}>
> {
	return query(
		`WITH RECURSIVE reportee_tree AS (
			SELECT uid, name, title, level FROM users WHERE manager_id = $1
			UNION ALL
			SELECT u.uid, u.name, u.title, u.level FROM users u
			INNER JOIN reportee_tree rt ON u.manager_id = rt.uid
		)
		SELECT
			o.id,
			o.name,
			o.type,
			o.description,
			o.metric,
			o.strategic_priority_id,
			sp.name as strategic_priority_name,
			o.parent_id,
			parent.name as parent_name,
			o.approved,
			o.owner_user_id,
			rt.name as owner_name,
			rt.title as owner_title,
			rt.level as owner_level,
			o.created_at
		FROM objectives o
		INNER JOIN reportee_tree rt ON o.owner_user_id = rt.uid
		LEFT JOIN strategic_priorities sp ON o.strategic_priority_id = sp.id
		LEFT JOIN objectives parent ON o.parent_id = parent.id
		ORDER BY rt.level, rt.name, o.type, o.created_at DESC`,
		[managerId]
	);
}
