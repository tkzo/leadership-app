<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Dashboard - Leadership App</title>
</svelte:head>

<h1>Hi, {data.user.name}</h1>

<div class="stats-grid">
	<div class="stat-card">
		<div class="stat-value">{data.stats.totalObjectives}</div>
		<div class="stat-label">Total Objectives</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.stats.approvedObjectives}</div>
		<div class="stat-label">Approved</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.stats.pendingObjectives}</div>
		<div class="stat-label">Pending Approval</div>
	</div>
	<div class="stat-card">
		<div class="stat-value">{data.stats.pendingShared}</div>
		<div class="stat-label">Shared with You</div>
	</div>
</div>

<section class="recent">
	<div class="section-header">
		<h2>Recent Objectives</h2>
		<a href="/objectives/new" class="button">New Objective</a>
	</div>

	{#if data.recentObjectives.length === 0}
		<p class="empty">No objectives yet. <a href="/objectives/new">Create your first objective</a></p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Type</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				{#each data.recentObjectives as objective}
					<tr>
						<td><a href="/objectives/{objective.id}">{objective.name}</a></td>
						<td class="type">{objective.type === 'big_rock' ? 'Big Rock' : 'RCI'}</td>
						<td>
							{#if objective.approved}
								<span class="badge approved">Approved</span>
							{:else}
								<span class="badge pending">Pending</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
		<p><a href="/objectives">View all objectives</a></p>
	{/if}
</section>

<style>
	h1 {
		margin-bottom: 1.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		text-align: center;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 600;
		color: #1a1a2e;
	}

	.stat-label {
		color: #666;
		margin-top: 0.25rem;
	}

	.recent {
		background: white;
		border: 1px solid #eee;
		border-radius: 8px;
		padding: 1.5rem;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.section-header h2 {
		margin: 0;
		font-size: 1.25rem;
	}

	.button {
		padding: 0.5rem 1rem;
		background: #0066cc;
		color: white;
		text-decoration: none;
		border-radius: 4px;
	}

	.button:hover {
		background: #0052a3;
	}

	.empty {
		color: #666;
	}

	.empty a {
		color: #0066cc;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}

	th {
		font-weight: 600;
		color: #666;
		font-size: 0.875rem;
	}

	td a {
		color: #0066cc;
		text-decoration: none;
	}

	td a:hover {
		text-decoration: underline;
	}

	.type {
		color: #666;
		font-size: 0.875rem;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.badge.approved {
		background: #e6f4ea;
		color: #1e7e34;
	}

	.badge.pending {
		background: #fff3cd;
		color: #856404;
	}

	p {
		margin-top: 1rem;
	}

	p a {
		color: #0066cc;
	}
</style>
