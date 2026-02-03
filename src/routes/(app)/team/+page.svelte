<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Team Objectives - Leadership App</title>
</svelte:head>

<div class="header">
	<h1>Team Objectives</h1>
	<p class="subtitle">Objectives from all your direct and indirect reports</p>
</div>

{#if data.teamObjectives.length === 0}
	<div class="empty">
		<p>No team objectives found. Your reportees haven't created any objectives yet.</p>
	</div>
{:else}
	<table>
		<thead>
			<tr>
				<th>Owner</th>
				<th>Big Rock</th>
				<th>Strategic Priority</th>
				<th>Metric</th>
				<th>Risk Critical Initiatives</th>
			</tr>
		</thead>
		<tbody>
			{#each data.tableRows as row}
				<tr>
					<td class="owner-cell">
						<span class="owner-name">{row.bigRock.owner_name}</span>
						{#if row.bigRock.owner_title}
							<span class="owner-title">{row.bigRock.owner_title}</span>
						{/if}
						<span class="owner-level">Level {row.bigRock.owner_level}</span>
					</td>
					<td class="big-rock-cell">
						<span class="objective-name">{row.bigRock.name}</span>
						{#if row.bigRock.approved}
							<span class="badge approved">Approved</span>
						{:else}
							<span class="badge pending">Pending</span>
						{/if}
					</td>
					<td class="priority-cell">{row.bigRock.strategic_priority_name || '-'}</td>
					<td class="metric-cell">{row.bigRock.metric || '-'}</td>
					<td class="rci-cell">
						{#if row.rcis.length > 0}
							<ul class="rci-list">
								{#each row.rcis as rci}
									<li>
										<span class="rci-name">{rci.name}</span>
										{#if rci.approved}
											<span class="badge approved small">Approved</span>
										{:else}
											<span class="badge pending small">Pending</span>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<span class="no-rcis">-</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>

	{#if data.orphanRcis.length > 0}
		<div class="orphan-section">
			<h2>Risk Critical Initiatives (No Parent Big Rock)</h2>
			<table>
				<thead>
					<tr>
						<th>Owner</th>
						<th>Name</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.orphanRcis as rci}
						<tr>
							<td class="owner-cell">
								<span class="owner-name">{rci.owner_name}</span>
								{#if rci.owner_title}
									<span class="owner-title">{rci.owner_title}</span>
								{/if}
							</td>
							<td>{rci.name}</td>
							<td>
								{#if rci.approved}
									<span class="badge approved">Approved</span>
								{:else}
									<span class="badge pending">Pending</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
{/if}

<style>
	.header {
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
	}

	.subtitle {
		color: #666;
		margin: 0.25rem 0 0;
	}

	h2 {
		font-size: 1.125rem;
		margin: 2rem 0 1rem;
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

	.owner-cell {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		min-width: 150px;
	}

	.owner-name {
		font-weight: 600;
		color: #333;
	}

	.owner-title {
		font-size: 0.875rem;
		color: #666;
	}

	.owner-level {
		font-size: 0.75rem;
		color: #888;
	}

	.big-rock-cell {
		font-weight: 500;
	}

	.objective-name {
		display: block;
		margin-bottom: 0.25rem;
	}

	.priority-cell, .metric-cell {
		color: #666;
	}

	.rci-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.rci-list li {
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f0f0f0;
	}

	.rci-list li:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.rci-name {
		display: block;
		margin-bottom: 0.125rem;
	}

	.no-rcis {
		color: #999;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
	}

	.badge.small {
		font-size: 0.625rem;
		padding: 0.125rem 0.375rem;
	}

	.badge.approved {
		background: #e6f4ea;
		color: #1e7e34;
	}

	.badge.pending {
		background: #fff3cd;
		color: #856404;
	}

	.orphan-section {
		margin-top: 2rem;
	}

	.orphan-section table {
		max-width: 800px;
	}
</style>
