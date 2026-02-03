import { query, queryOne, execute } from '../index';
import type { SharedBigRock, SharedBigRockRecipient } from '$lib/types';

export async function createSharedBigRock(data: {
	objectiveId: string;
	fromUserId: string;
}): Promise<SharedBigRock> {
	const result = await queryOne<SharedBigRock>(
		`INSERT INTO shared_big_rocks (objective_id, from_user_id)
		 VALUES ($1, $2)
		 RETURNING *`,
		[data.objectiveId, data.fromUserId]
	);
	return result!;
}

export async function addSharedBigRockRecipient(data: {
	sharedBigRockId: string;
	toUserId: string;
}): Promise<SharedBigRockRecipient> {
	const result = await queryOne<SharedBigRockRecipient>(
		`INSERT INTO shared_big_rock_recipients (shared_big_rock_id, to_user_id)
		 VALUES ($1, $2)
		 RETURNING *`,
		[data.sharedBigRockId, data.toUserId]
	);
	return result!;
}

export async function getIncomingSharedBigRocks(userId: string): Promise<
	Array<{
		recipient_id: string;
		shared_big_rock_id: string;
		accepted: boolean | null;
		objective_id: string;
		objective_name: string;
		objective_type: 'big_rock' | 'risk_critical_initiative';
		objective_description: string | null;
		objective_metric: string | null;
		objective_parent_id: string | null;
		parent_objective_name: string | null;
		strategic_priority_name: string | null;
		from_user_id: string;
		from_user_name: string;
		from_user_title: string | null;
		shared_at: Date;
	}>
> {
	return query(
		`SELECT
			sbr.id as recipient_id,
			sbr.shared_big_rock_id,
			sbr.accepted,
			sb.objective_id,
			o.name as objective_name,
			o.type as objective_type,
			o.description as objective_description,
			o.metric as objective_metric,
			o.parent_id as objective_parent_id,
			parent.name as parent_objective_name,
			sp.name as strategic_priority_name,
			sb.from_user_id,
			u.name as from_user_name,
			u.title as from_user_title,
			sb.created_at as shared_at
		 FROM shared_big_rock_recipients sbr
		 JOIN shared_big_rocks sb ON sbr.shared_big_rock_id = sb.id
		 JOIN objectives o ON sb.objective_id = o.id
		 JOIN users u ON sb.from_user_id = u.uid
		 LEFT JOIN strategic_priorities sp ON o.strategic_priority_id = sp.id
		 LEFT JOIN objectives parent ON o.parent_id = parent.id
		 WHERE sbr.to_user_id = $1 AND sbr.accepted IS NULL
		 ORDER BY o.type DESC, parent.name NULLS FIRST, o.name`,
		[userId]
	);
}

export async function getIncomingSharesFromManager(userId: string, managerId: string): Promise<
	Array<{
		recipient_id: string;
		shared_big_rock_id: string;
		accepted: boolean | null;
		objective_id: string;
		objective_name: string;
		objective_type: 'big_rock' | 'risk_critical_initiative';
		objective_description: string | null;
		objective_metric: string | null;
		objective_parent_id: string | null;
		parent_objective_name: string | null;
		strategic_priority_name: string | null;
		from_user_id: string;
		from_user_name: string;
		from_user_title: string | null;
		shared_at: Date;
	}>
> {
	return query(
		`SELECT
			sbr.id as recipient_id,
			sbr.shared_big_rock_id,
			sbr.accepted,
			sb.objective_id,
			o.name as objective_name,
			o.type as objective_type,
			o.description as objective_description,
			o.metric as objective_metric,
			o.parent_id as objective_parent_id,
			parent.name as parent_objective_name,
			sp.name as strategic_priority_name,
			sb.from_user_id,
			u.name as from_user_name,
			u.title as from_user_title,
			sb.created_at as shared_at
		 FROM shared_big_rock_recipients sbr
		 JOIN shared_big_rocks sb ON sbr.shared_big_rock_id = sb.id
		 JOIN objectives o ON sb.objective_id = o.id
		 JOIN users u ON sb.from_user_id = u.uid
		 LEFT JOIN strategic_priorities sp ON o.strategic_priority_id = sp.id
		 LEFT JOIN objectives parent ON o.parent_id = parent.id
		 WHERE sbr.to_user_id = $1 AND sb.from_user_id = $2
		 ORDER BY o.type DESC, parent.name NULLS FIRST, o.name`,
		[userId, managerId]
	);
}

export async function getSharedBigRockRecipient(
	recipientId: string
): Promise<SharedBigRockRecipient | null> {
	return queryOne<SharedBigRockRecipient>(
		'SELECT * FROM shared_big_rock_recipients WHERE id = $1',
		[recipientId]
	);
}

export async function updateRecipientAccepted(
	recipientId: string,
	accepted: boolean
): Promise<void> {
	await execute('UPDATE shared_big_rock_recipients SET accepted = $1 WHERE id = $2', [
		accepted,
		recipientId
	]);
}

export async function getSharedRecipientIds(objectiveId: string, fromUserId: string): Promise<string[]> {
	const result = await query<{ to_user_id: string }>(
		`SELECT DISTINCT sbr.to_user_id
		 FROM shared_big_rock_recipients sbr
		 JOIN shared_big_rocks sb ON sbr.shared_big_rock_id = sb.id
		 WHERE sb.objective_id = $1 AND sb.from_user_id = $2`,
		[objectiveId, fromUserId]
	);
	return result.map(r => r.to_user_id);
}

export async function getSharedBigRockWithObjective(sharedBigRockId: string): Promise<{
	id: string;
	objective_id: string;
	from_user_id: string;
	objective_name: string;
	objective_type: 'big_rock' | 'risk_critical_initiative';
	objective_description: string | null;
	objective_metric: string | null;
	objective_strategic_priority_id: string | null;
	parent_strategic_priority_id: string | null;
} | null> {
	return queryOne(
		`SELECT
			sb.id,
			sb.objective_id,
			sb.from_user_id,
			o.name as objective_name,
			o.type as objective_type,
			o.description as objective_description,
			o.metric as objective_metric,
			o.strategic_priority_id as objective_strategic_priority_id,
			parent.strategic_priority_id as parent_strategic_priority_id
		 FROM shared_big_rocks sb
		 JOIN objectives o ON sb.objective_id = o.id
		 LEFT JOIN objectives parent ON o.parent_id = parent.id
		 WHERE sb.id = $1`,
		[sharedBigRockId]
	);
}

export async function getOutgoingSharesByUser(fromUserId: string): Promise<
	Array<{
		objective_id: string;
		to_user_id: string;
		to_user_name: string;
		to_user_title: string | null;
		accepted: boolean | null;
		shared_at: Date;
	}>
> {
	return query(
		`SELECT
			sb.objective_id,
			sbr.to_user_id,
			u.name as to_user_name,
			u.title as to_user_title,
			sbr.accepted,
			sb.created_at as shared_at
		 FROM shared_big_rock_recipients sbr
		 JOIN shared_big_rocks sb ON sbr.shared_big_rock_id = sb.id
		 JOIN users u ON sbr.to_user_id = u.uid
		 WHERE sb.from_user_id = $1
		 ORDER BY sb.created_at DESC`,
		[fromUserId]
	);
}
