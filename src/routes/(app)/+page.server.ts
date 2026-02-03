import type { PageServerLoad } from './$types';
import { getObjectivesByOwner } from '$lib/db/queries/objectives';
import { getIncomingSharedBigRocks } from '$lib/db/queries/shared-big-rocks';

export const load: PageServerLoad = async ({ locals }) => {
	const objectives = await getObjectivesByOwner(locals.user!.uid);
	const pendingShared = await getIncomingSharedBigRocks(locals.user!.uid);

	const approvedObjectives = objectives.filter((o) => o.approved);
	const pendingObjectives = objectives.filter((o) => !o.approved);

	return {
		stats: {
			totalObjectives: objectives.length,
			approvedObjectives: approvedObjectives.length,
			pendingObjectives: pendingObjectives.length,
			pendingShared: pendingShared.length
		},
		recentObjectives: objectives.slice(0, 5)
	};
};
