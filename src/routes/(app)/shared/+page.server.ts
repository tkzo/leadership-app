import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getIncomingSharedBigRocks,
	getSharedBigRockRecipient,
	updateRecipientAccepted,
	getSharedBigRockWithObjective
} from '$lib/db/queries/shared-big-rocks';
import { createObjective, getObjectivesByOwnerAndType } from '$lib/db/queries/objectives';

export const load: PageServerLoad = async ({ locals }) => {
	const incomingShares = await getIncomingSharedBigRocks(locals.user!.uid);
	const myBigRocks = await getObjectivesByOwnerAndType(locals.user!.uid, 'big_rock');

	// Group shares: Big Rocks with their child RCIs
	const bigRocks = incomingShares.filter((s) => s.objective_type === 'big_rock');
	const rcis = incomingShares.filter((s) => s.objective_type === 'risk_critical_initiative');

	// Create a map of Big Rock objective_id to its share data
	const bigRockMap = new Map(bigRocks.map((br) => [br.objective_id, br]));

	// Group RCIs by their parent Big Rock
	const rcisByParent = new Map<string | null, typeof rcis>();
	for (const rci of rcis) {
		const parentId = rci.objective_parent_id;
		if (!rcisByParent.has(parentId)) {
			rcisByParent.set(parentId, []);
		}
		rcisByParent.get(parentId)!.push(rci);
	}

	// Build grouped data structure
	type ShareType = typeof incomingShares[0];
	const groupedShares: Array<{
		bigRock: ShareType;
		rcis: ShareType[];
	}> = [];

	// Add Big Rocks with their child RCIs
	for (const br of bigRocks) {
		groupedShares.push({
			bigRock: br,
			rcis: rcisByParent.get(br.objective_id) || []
		});
		// Remove from rcisByParent so we don't show them again
		rcisByParent.delete(br.objective_id);
	}

	// Orphan RCIs (parent Big Rock not in the shared list)
	const orphanRcis = Array.from(rcisByParent.values()).flat();

	return { incomingShares, groupedShares, orphanRcis, myBigRocks };
};

export const actions: Actions = {
	accept: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();
		const type = data.get('type')?.toString() as 'big_rock' | 'risk_critical_initiative';
		const parentId = data.get('parentId')?.toString() || undefined;

		if (!recipientId || !type) {
			return fail(400, { error: 'Missing required fields' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		const sharedBigRock = await getSharedBigRockWithObjective(recipient.shared_big_rock_id);
		if (!sharedBigRock) {
			return fail(404, { error: 'Shared big rock not found' });
		}

		// Mark as accepted
		await updateRecipientAccepted(recipientId, true);

		// Create new objective for the accepting user
		const user = locals.user!;
		const approved = user.level <= 2;

		// Determine strategic priority:
		// - If accepting an RCI as a Big Rock, use the parent's strategic priority
		// - Otherwise, use the objective's own strategic priority
		let strategicPriorityId: string | undefined;
		if (type === 'big_rock' && sharedBigRock.objective_type === 'risk_critical_initiative') {
			strategicPriorityId = sharedBigRock.parent_strategic_priority_id || undefined;
		} else {
			strategicPriorityId = sharedBigRock.objective_strategic_priority_id || undefined;
		}

		await createObjective({
			name: sharedBigRock.objective_name,
			type,
			description: sharedBigRock.objective_description || undefined,
			metric: sharedBigRock.objective_metric || undefined,
			strategicPriorityId,
			parentId,
			ownerUserId: user.uid,
			receivedFromUserId: sharedBigRock.from_user_id,
			approved
		});

		return { accepted: true };
	},

	ignore: async ({ request, locals }) => {
		const data = await request.formData();
		const recipientId = data.get('recipientId')?.toString();

		if (!recipientId) {
			return fail(400, { error: 'Missing recipient ID' });
		}

		const recipient = await getSharedBigRockRecipient(recipientId);
		if (!recipient || recipient.to_user_id !== locals.user!.uid) {
			return fail(403, { error: 'Permission denied' });
		}

		await updateRecipientAccepted(recipientId, false);
		return { ignored: true };
	}
};
