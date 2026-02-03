import { redirect } from '@sveltejs/kit';
import type { User } from '$lib/types';

export function requireAuth(user: User | null): asserts user is User {
	if (!user) {
		throw redirect(303, '/login');
	}
}

export function requireEmailVerified(user: User | null): asserts user is User {
	requireAuth(user);
	if (!user.email_verified) {
		throw redirect(303, '/verify-email?pending=true');
	}
}

export function requireAdmin(user: User | null): asserts user is User {
	requireAuth(user);
	if (!user.admin) {
		throw redirect(303, '/');
	}
}
