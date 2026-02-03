import type { PageServerLoad } from './$types';
import { getAllUsers } from '$lib/db/queries/users';

interface OrgNode {
	uid: string;
	name: string;
	title: string | null;
	level: number;
	email: string;
	children: OrgNode[];
}

export const load: PageServerLoad = async () => {
	const users = await getAllUsers();

	// Build a map of users by uid
	const userMap = new Map(users.map((u) => [u.uid, u]));

	// Build the tree structure
	const rootNodes: OrgNode[] = [];
	const nodeMap = new Map<string, OrgNode>();

	// First, create all nodes
	for (const user of users) {
		nodeMap.set(user.uid, {
			uid: user.uid,
			name: user.name,
			title: user.title,
			level: user.level,
			email: user.email,
			children: []
		});
	}

	// Then, build the tree by linking children to parents
	for (const user of users) {
		const node = nodeMap.get(user.uid)!;
		if (user.manager_id && nodeMap.has(user.manager_id)) {
			nodeMap.get(user.manager_id)!.children.push(node);
		} else {
			// No manager or manager not found - this is a root node
			rootNodes.push(node);
		}
	}

	// Sort children by level, then by name
	function sortChildren(node: OrgNode) {
		node.children.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
		for (const child of node.children) {
			sortChildren(child);
		}
	}

	for (const root of rootNodes) {
		sortChildren(root);
	}

	// Sort root nodes by level, then by name
	rootNodes.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

	return { orgTree: rootNodes, totalUsers: users.length };
};
