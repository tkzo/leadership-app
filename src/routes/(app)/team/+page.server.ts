import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getTeamObjectives } from '$lib/db/queries/objectives';
import { hasReportees } from '$lib/db/queries/users';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	// Check if user has reportees
	const userHasReportees = await hasReportees(user.uid);
	if (!userHasReportees) {
		throw redirect(303, '/objectives');
	}

	const teamObjectives = await getTeamObjectives(user.uid);

	// Separate big rocks and RCIs
	const bigRocks = teamObjectives.filter((o) => o.type === 'big_rock');
	const rcis = teamObjectives.filter((o) => o.type === 'risk_critical_initiative');

	// Group by owner for better display
	const objectivesByOwner = new Map<string, typeof teamObjectives>();
	for (const obj of teamObjectives) {
		const key = obj.owner_user_id;
		if (!objectivesByOwner.has(key)) {
			objectivesByOwner.set(key, []);
		}
		objectivesByOwner.get(key)!.push(obj);
	}

	// Create table rows grouped by owner's big rocks with their RCIs
	const tableRows: Array<{
		bigRock: (typeof bigRocks)[0];
		rcis: (typeof rcis)[0][];
	}> = [];

	for (const br of bigRocks) {
		const relatedRcis = rcis.filter(
			(rci) => rci.parent_id === br.id && rci.owner_user_id === br.owner_user_id
		);
		tableRows.push({ bigRock: br, rcis: relatedRcis });
	}

	// Get orphan RCIs (no parent or parent from different owner)
	const orphanRcis = rcis.filter((rci) => {
		if (!rci.parent_id) return true;
		// Check if parent belongs to the same owner
		const parentBr = bigRocks.find((br) => br.id === rci.parent_id);
		return !parentBr || parentBr.owner_user_id !== rci.owner_user_id;
	});

	return { tableRows, orphanRcis, teamObjectives };
};
