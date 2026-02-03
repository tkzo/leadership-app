<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<svelte:head>
	<title>Approvals - Leadership App</title>
</svelte:head>

<h1>Pending Approvals</h1>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if form?.approved}
	<div class="success">
		Objective approved.
		{#if form.adopted}
			A copy has been added to your objectives.
		{/if}
	</div>
{/if}

{#if form?.rejected}
	<div class="success">Objective rejected.</div>
{/if}

{#if data.pendingApprovals.length === 0}
	<div class="empty">
		<p>No pending approvals from your team.</p>
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
				<th>Submitted By</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each data.groupedApprovals as group}
				<!-- Big Rock Row -->
				<tr class="big-rock-row">
					<td class="type-cell">
						<span class="type-badge big-rock">Big Rock</span>
					</td>
					<td class="name-cell">
						<span class="objective-name">{group.bigRock.name}</span>
						{#if group.bigRock.description}
							<span class="description">{group.bigRock.description}</span>
						{/if}
					</td>
					<td class="parent-cell">-</td>
					<td class="priority-cell">{group.bigRock.strategic_priority_name || '-'}</td>
					<td class="metric-cell">{group.bigRock.metric || '-'}</td>
					<td class="submitted-by-cell">
						<span class="owner-name">{group.bigRock.owner_name}</span>
						{#if group.bigRock.owner_title}
							<span class="owner-title">{group.bigRock.owner_title}</span>
						{/if}
					</td>
					<td class="actions-cell">
						<form method="POST" use:enhance class="approve-form">
							<input type="hidden" name="objectiveId" value={group.bigRock.id} />
							<div class="form-row">
								<input type="text" name="comments" placeholder="Comments (optional)" class="comments-input" />
								<label class="adopt-label">
									<input type="checkbox" name="adopt" />
									Adopt
								</label>
								<button type="submit" formaction="?/approve" class="approve-btn">Approve</button>
								<button type="submit" formaction="?/reject" class="reject-btn">Reject</button>
							</div>
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
								<span class="objective-name">{rci.name}</span>
								{#if rci.description}
									<span class="description">{rci.description}</span>
								{/if}
							</div>
						</td>
						<td class="parent-cell parent-link">{rci.parent_name || '-'}</td>
						<td class="priority-cell">-</td>
						<td class="metric-cell">-</td>
						<td class="submitted-by-cell">
							<span class="owner-name">{rci.owner_name}</span>
							{#if rci.owner_title}
								<span class="owner-title">{rci.owner_title}</span>
							{/if}
						</td>
						<td class="actions-cell">
							<form method="POST" use:enhance class="approve-form">
								<input type="hidden" name="objectiveId" value={rci.id} />
								<div class="form-row">
									<input type="text" name="comments" placeholder="Comments (optional)" class="comments-input" />
									<label class="adopt-label">
										<input type="checkbox" name="adopt" />
										Adopt
									</label>
									<button type="submit" formaction="?/approve" class="approve-btn">Approve</button>
									<button type="submit" formaction="?/reject" class="reject-btn">Reject</button>
								</div>
							</form>
						</td>
					</tr>
				{/each}
			{/each}
			<!-- Orphan RCIs (no parent Big Rock in pending list) -->
			{#each data.orphanRcis as rci}
				<tr class="rci-row">
					<td class="type-cell">
						<span class="type-badge rci">RCI</span>
					</td>
					<td class="name-cell">
						<span class="objective-name">{rci.name}</span>
						{#if rci.description}
							<span class="description">{rci.description}</span>
						{/if}
					</td>
					<td class="parent-cell parent-link">{rci.parent_name || '-'}</td>
					<td class="priority-cell">-</td>
					<td class="metric-cell">-</td>
					<td class="submitted-by-cell">
						<span class="owner-name">{rci.owner_name}</span>
						{#if rci.owner_title}
							<span class="owner-title">{rci.owner_title}</span>
						{/if}
					</td>
					<td class="actions-cell">
						<form method="POST" use:enhance class="approve-form">
							<input type="hidden" name="objectiveId" value={rci.id} />
							<div class="form-row">
								<input type="text" name="comments" placeholder="Comments (optional)" class="comments-input" />
								<label class="adopt-label">
									<input type="checkbox" name="adopt" />
									Adopt
								</label>
								<button type="submit" formaction="?/approve" class="approve-btn">Approve</button>
								<button type="submit" formaction="?/reject" class="reject-btn">Reject</button>
							</div>
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

	.submitted-by-cell {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		min-width: 150px;
	}

	.owner-name {
		font-weight: 500;
	}

	.owner-title {
		font-size: 0.75rem;
		color: #666;
	}

	.actions-cell {
		min-width: 300px;
	}

	.approve-form {
		margin: 0;
	}

	.form-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.comments-input {
		flex: 1;
		min-width: 120px;
		padding: 0.375rem 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 0.75rem;
	}

	.adopt-label {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.75rem;
		color: #666;
		white-space: nowrap;
	}

	.approve-btn {
		padding: 0.375rem 0.75rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.approve-btn:hover {
		background: #218838;
	}

	.reject-btn {
		padding: 0.375rem 0.75rem;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.75rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.reject-btn:hover {
		background: #c82333;
	}
</style>
