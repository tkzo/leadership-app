export interface User {
	uid: string;
	name: string;
	title: string | null;
	level: number;
	manager_id: string | null;
	admin: boolean;
	email: string;
	password_hash: string;
	email_verified: boolean;
	verification_token: string | null;
	reset_token: string | null;
	reset_token_expires: Date | null;
	created_at: Date;
}

export interface StrategicPriority {
	id: string;
	name: string;
	description: string | null;
	created_at: Date;
}

export interface Objective {
	id: string;
	name: string;
	type: 'big_rock' | 'risk_critical_initiative';
	description: string | null;
	metric: string | null;
	strategic_priority_id: string | null;
	parent_id: string | null;
	owner_user_id: string;
	received_from_user_id: string | null;
	approved: boolean;
	rejected: boolean;
	comments: string | null;
	created_at: Date;
}

export interface SharedBigRock {
	id: string;
	objective_id: string;
	from_user_id: string;
	created_at: Date;
}

export interface SharedBigRockRecipient {
	id: string;
	shared_big_rock_id: string;
	to_user_id: string;
	accepted: boolean | null;
	created_at: Date;
}

export interface Session {
	id: string;
	user_id: string;
	expires_at: Date;
	created_at: Date;
}
