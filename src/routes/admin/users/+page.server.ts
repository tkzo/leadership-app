import type { PageServerLoad } from './$types';
import { getAllUsers } from '$lib/db/queries/users';

export const load: PageServerLoad = async () => {
	const users = await getAllUsers();
	return { users };
};
