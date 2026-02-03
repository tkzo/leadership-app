<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<svelte:head>
	<title>Shared with Me - Leadership App</title>
</svelte:head>

<h1>Shared with Me</h1>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if form?.accepted}
	<div class="success">Objective accepted and added to your list.</div>
{/if}

{#if form?.ignored}
	<div class="success">Shared objective ignored.</div>
{/if}

{#if data.incomingShares.length === 0}
	<div class="empty">
		<p>No pending shared objectives.</p>
	</div>
{:else}
	<table>
		<thead>
			<tr>
				<th>Type</th>
				<th>Name</th>
				<th>Parent Big Rock</th>
				<th>Strategic Priority</th>
				<th>Metric</th>
				<th>Shared By</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.groupedShares as group}
				<!-- Big Rock Row -->
				<tr class="big-rock-row">
					<td class="type-cell">
						<span class="type-badge big-rock">Big Rock</span>
					</td>
					<td class="name-cell">
						<span class="objective-name">{group.bigRock.objective_name}</span>
						{#if group.bigRock.objective_description}
							<span class="description">{group.bigRock.objective_description}</span>
						{/if}
					</td>
					<td class="parent-cell">-</td>
					<td class="priority-cell">{group.bigRock.strategic_priority_name || '-'}</td>
					<td class="metric-cell">{group.bigRock.objective_metric || '-'}</td>
					<td class="shared-by-cell">
						<span class="from-name">{group.bigRock.from_user_name}{#if group.bigRock.from_user_title}, {group.bigRock.from_user_title}{/if}</span>
						<span class="date">{new Date(group.bigRock.shared_at).toLocaleDateString()}</span>
					</td>
					<td class="actions-cell">
						<form method="POST" action="?/accept" use:enhance class="inline-form">
							<input type="hidden" name="recipientId" value={group.bigRock.recipient_id} />
							<input type="hidden" name="type" value="big_rock" />
							<button type="submit" class="accept-br-btn">Accept as Big Rock</button>
						</form>
						<form method="POST" action="?/accept" use:enhance class="rci-form">
							<input type="hidden" name="recipientId" value={group.bigRock.recipient_id} />
							<input type="hidden" name="type" value="risk_critical_initiative" />
							{#if data.myBigRocks.length > 0}
								<select name="parentId" id="parent-{group.bigRock.recipient_id}">
									<option value="">No parent</option>
									{#each data.myBigRocks as bigRock}
										<option value={bigRock.id}>{bigRock.name}</option>
									{/each}
								</select>
							{/if}
							<button type="submit" class="accept-rci-btn">Accept as RCI</button>
						</form>
						<form method="POST" action="?/ignore" use:enhance class="inline-form">
							<input type="hidden" name="recipientId" value={group.bigRock.recipient_id} />
							<button type="submit" class="ignore-btn">Ignore</button>
						</form>
					</td>
				</tr>
				<!-- Child RCI Rows -->
				{#each group.rcis as rci}
					<tr class="rci-row child-row">
						<td class="type-cell">
							<span class="type-badge rci">RCI</span>
						</td>
						<td class="name-cell indented">
							<span class="indent-marker"></span>
							<div>
								<span class="objective-name">{rci.objective_name}</span>
								{#if rci.objective_description}
									<span class="description">{rci.objective_description}</span>
								{/if}
							</div>
						</td>
						<td class="parent-cell parent-link">{rci.parent_objective_name || '-'}</td>
						<td class="priority-cell">-</td>
						<td class="metric-cell">-</td>
						<td class="shared-by-cell">
							<span class="from-name">{rci.from_user_name}{#if rci.from_user_title}, {rci.from_user_title}{/if}</span>
							<span class="date">{new Date(rci.shared_at).toLocaleDateString()}</span>
						</td>
						<td class="actions-cell">
							<form method="POST" action="?/accept" use:enhance class="inline-form">
								<input type="hidden" name="recipientId" value={rci.recipient_id} />
								<input type="hidden" name="type" value="big_rock" />
								<button type="submit" class="accept-br-btn">Accept as Big Rock</button>
							</form>
							<form method="POST" action="?/accept" use:enhance class="rci-form">
								<input type="hidden" name="recipientId" value={rci.recipient_id} />
								<input type="hidden" name="type" value="risk_critical_initiative" />
								{#if data.myBigRocks.length > 0}
									<select name="parentId" id="parent-rci-{rci.recipient_id}">
										<option value="">No parent</option>
										{#each data.myBigRocks as bigRock}
											<option value={bigRock.id}>{bigRock.name}</option>
										{/each}
									</select>
								{/if}
								<button type="submit" class="accept-rci-btn">Accept as RCI</button>
							</form>
							<form method="POST" action="?/ignore" use:enhance class="inline-form">
								<input type="hidden" name="recipientId" value={rci.recipient_id} />
								<button type="submit" class="ignore-btn">Ignore</button>
							</form>
						</td>
					</tr>
				{/each}
			{/each}
			<!-- Orphan RCIs (no parent Big Rock in shared list) -->
			{#each data.orphanRcis as rci}
				<tr class="rci-row">
					<td class="type-cell">
						<span class="type-badge rci">RCI</span>
					</td>
					<td class="name-cell">
						<span class="objective-name">{rci.objective_name}</span>
						{#if rci.objective_description}
							<span class="description">{rci.objective_description}</span>
						{/if}
					</td>
					<td class="parent-cell parent-link">{rci.parent_objective_name || '-'}</td>
					<td class="priority-cell">-</td>
					<td class="metric-cell">-</td>
					<td class="shared-by-cell">
						<span class="from-name">{rci.from_user_name}{#if rci.from_user_title}, {rci.from_user_title}{/if}</span>
						<span class="date">{new Date(rci.shared_at).toLocaleDateString()}</span>
					</td>
					<td class="actions-cell">
						<form method="POST" action="?/accept" use:enhance class="inline-form">
							<input type="hidden" name="recipientId" value={rci.recipient_id} />
							<input type="hidden" name="type" value="big_rock" />
							<button type="submit" class="accept-br-btn">Accept as Big Rock</button>
						</form>
						<form method="POST" action="?/accept" use:enhance class="rci-form">
							<input type="hidden" name="recipientId" value={rci.recipient_id} />
							<input type="hidden" name="type" value="risk_critical_initiative" />
							{#if data.myBigRocks.length > 0}
								<select name="parentId" id="parent-orphan-{rci.recipient_id}">
									<option value="">No parent</option>
									{#each data.myBigRocks as bigRock}
										<option value={bigRock.id}>{bigRock.name}</option>
									{/each}
								</select>
							{/if}
							<button type="submit" class="accept-rci-btn">Accept as RCI</button>
						</form>
						<form method="POST" action="?/ignore" use:enhance class="inline-form">
							<input type="hidden" name="recipientId" value={rci.recipient_id} />
							<button type="submit" class="ignore-btn">Ignore</button>
						</form>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	h1 {
		margin-bottom: 1.5rem;
	}

	.error {
		background: #fee;
		border: 1px solid #f00;
		color: #c00;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.success {
		background: #efe;
		border: 1px solid #0a0;
		color: #060;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.empty {
		text-align: center;
		padding: 3rem;
		background: #f9f9f9;
		border-radius: 8px;
		color: #666;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	th, td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #eee;
		vertical-align: top;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
	}

	.big-rock-row {
		background: #fafafa;
	}

	.child-row {
		background: #fff;
	}

	.type-cell {
		width: 80px;
	}

	.type-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
	}

	.type-badge.big-rock {
		background: #e3f2fd;
		color: #1565c0;
	}

	.type-badge.rci {
		background: #f3e5f5;
		color: #7b1fa2;
	}

	.name-cell {
		font-weight: 500;
		min-width: 200px;
	}

	.name-cell.indented {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.indent-marker {
		display: inline-block;
		width: 16px;
		height: 16px;
		border-left: 2px solid #ccc;
		border-bottom: 2px solid #ccc;
		margin-top: 4px;
		flex-shrink: 0;
	}

	.objective-name {
		display: block;
		color: #333;
	}

	.description {
		display: block;
		font-weight: 400;
		font-size: 0.875rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.parent-cell {
		color: #666;
		min-width: 120px;
	}

	.parent-link {
		color: #0066cc;
		font-weight: 500;
	}

	.priority-cell, .metric-cell {
		color: #666;
	}

	.shared-by-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 150px;
	}

	.from-name {
		font-weight: 500;
	}

	.date {
		font-size: 0.75rem;
		color: #888;
	}

	.actions-cell {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-width: 200px;
	}

	.inline-form {
		display: inline;
	}

	.rci-form {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	select {
		padding: 0.375rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.75rem;
		max-width: 150px;
	}

	button {
		padding: 0.375rem 0.75rem;
		border: none;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.accept-br-btn {
		background: #0066cc;
		color: white;
	}

	.accept-br-btn:hover {
		background: #0052a3;
	}

	.accept-rci-btn {
		background: #28a745;
		color: white;
	}

	.accept-rci-btn:hover {
		background: #218838;
	}

	.ignore-btn {
		background: #f5f5f5;
		color: #666;
	}

	.ignore-btn:hover {
		background: #e5e5e5;
	}
</style>
