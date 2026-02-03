<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: canPublish = data.objectives.length > 0 && data.reportees.length > 0;
	$: canRequestApproval = data.needsApproval && data.hasUnapprovedObjectives && data.manager;

	// Filter out manager from shared with list (manager shares are for approval, not display)
	function filterSharedWith(sharedWith: typeof data.groupedObjectives[0]['bigRock']['sharedWith']) {
		if (!data.user.manager_id) return sharedWith;
		return sharedWith.filter(share => share.to_user_id !== data.user.manager_id);
	}
</script>

<svelte:head>
	<title>My Objectives - Leadership App</title>
</svelte:head>

<div class="header">
	<h1>My Objectives</h1>
	<div class="header-actions">
		{#if canRequestApproval}
			<form method="POST" action="?/requestApproval" use:enhance class="action-form">
				<button type="submit" class="approval-button">Request Approval</button>
			</form>
		{/if}
		{#if canPublish}
			<form method="POST" action="?/publish" use:enhance class="action-form">
				<button type="submit" class="publish-button">Publish All to Reportees</button>
			</form>
		{/if}
		<a href="/objectives/new" class="button">New Objective</a>
	</div>
</div>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if form?.published}
	<div class="success">Published {form.objectiveCount} objective(s) to {form.recipientCount} reportee(s).</div>
{/if}

{#if form?.approvalRequested}
	<div class="success">Approval requested for {form.objectiveCount} objective(s) from {data.manager?.name}.</div>
{/if}

{#if data.objectives.length === 0}
	<div class="empty">
		<p>You don't have any objectives yet.</p>
		<a href="/objectives/new" class="button">Create your first objective</a>
	</div>
{:else}
	<table>
		<thead>
			<tr>
				<th>Type</th>
				<th>Name</th>
				<th>Strategic Priority</th>
				<th>Metric</th>
				<th>Status</th>
				<th>Manager Comments</th>
				<th>Received From</th>
				<th>Shared With</th>
			</tr>
		</thead>
		<tbody>
			{#each data.groupedObjectives as group}
				<!-- Big Rock Row -->
				<tr class="big-rock-row">
					<td class="type-cell">
						<span class="type-badge big-rock">Big Rock</span>
					</td>
					<td class="name-cell">
						<div class="name-row">
							<a href="/objectives/{group.bigRock.id}">{group.bigRock.name}</a>
							{#if group.bigRock.sharedWith.length > 0}
								<span class="lock-icon" title="Locked - has been shared/published">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
										<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
									</svg>
								</span>
							{/if}
						</div>
						{#if group.bigRock.description}
							<span class="description">{group.bigRock.description}</span>
						{/if}
					</td>
					<td class="priority-cell">{group.bigRock.strategic_priority_name || '-'}</td>
					<td class="metric-cell">{group.bigRock.metric || '-'}</td>
					<td class="status-cell">
						{#if group.bigRock.approved}
							<span class="badge approved">Approved</span>
						{:else if group.bigRock.rejected}
							<span class="badge rejected">Rejected</span>
						{:else}
							<span class="badge pending">Pending</span>
						{/if}
					</td>
					<td class="comments-cell">
						{#if group.bigRock.comments}
							<span class="manager-comments">{group.bigRock.comments}</span>
						{:else}
							<span class="no-comments">-</span>
						{/if}
					</td>
					<td class="received-from-cell">
						{#if group.bigRock.received_from_name}
							<span class="from-name">{group.bigRock.received_from_name}{#if group.bigRock.received_from_title}, {group.bigRock.received_from_title}{/if}</span>
						{:else}
							<span class="not-received">-</span>
						{/if}
					</td>
					<td class="shared-cell">
						{#if filterSharedWith(group.bigRock.sharedWith).length > 0}
							<ul class="shared-list">
								{#each filterSharedWith(group.bigRock.sharedWith) as share}
									<li>
										<span class="shared-name">{share.to_user_name}</span>
										{#if share.to_user_title}
											<span class="shared-title">{share.to_user_title}</span>
										{/if}
										{#if share.accepted === true}
											<span class="badge accepted small">Accepted</span>
										{:else if share.accepted === false}
											<span class="badge ignored small">Ignored</span>
										{:else}
											<span class="badge waiting small">Pending</span>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<span class="not-shared">-</span>
						{/if}
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
								<div class="name-row">
									<a href="/objectives/{rci.id}">{rci.name}</a>
									{#if rci.sharedWith.length > 0}
										<span class="lock-icon" title="Locked - has been shared/published">
											<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
												<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
											</svg>
										</span>
									{/if}
								</div>
								{#if rci.description}
									<span class="description">{rci.description}</span>
								{/if}
							</div>
						</td>
						<td class="priority-cell">-</td>
						<td class="metric-cell">-</td>
						<td class="status-cell">
							{#if rci.approved}
								<span class="badge approved">Approved</span>
							{:else if rci.rejected}
								<span class="badge rejected">Rejected</span>
							{:else}
								<span class="badge pending">Pending</span>
							{/if}
						</td>
						<td class="comments-cell">
							{#if rci.comments}
								<span class="manager-comments">{rci.comments}</span>
							{:else}
								<span class="no-comments">-</span>
							{/if}
						</td>
						<td class="received-from-cell">
							{#if rci.received_from_name}
								<span class="from-name">{rci.received_from_name}{#if rci.received_from_title}, {rci.received_from_title}{/if}</span>
							{:else}
								<span class="not-received">-</span>
							{/if}
						</td>
						<td class="shared-cell">
							{#if filterSharedWith(rci.sharedWith).length > 0}
								<ul class="shared-list">
									{#each filterSharedWith(rci.sharedWith) as share}
										<li>
											<span class="shared-name">{share.to_user_name}</span>
											{#if share.to_user_title}
												<span class="shared-title">{share.to_user_title}</span>
											{/if}
											{#if share.accepted === true}
												<span class="badge accepted small">Accepted</span>
											{:else if share.accepted === false}
												<span class="badge ignored small">Ignored</span>
											{:else}
												<span class="badge waiting small">Pending</span>
											{/if}
										</li>
									{/each}
								</ul>
							{:else}
								<span class="not-shared">-</span>
							{/if}
						</td>
					</tr>
				{/each}
			{/each}
			<!-- Orphan RCIs (no parent Big Rock) -->
			{#each data.orphanRcis as rci}
				<tr class="rci-row">
					<td class="type-cell">
						<span class="type-badge rci">RCI</span>
					</td>
					<td class="name-cell">
						<div class="name-row">
							<a href="/objectives/{rci.id}">{rci.name}</a>
							{#if rci.sharedWith.length > 0}
								<span class="lock-icon" title="Locked - has been shared/published">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
										<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
									</svg>
								</span>
							{/if}
						</div>
						{#if rci.description}
							<span class="description">{rci.description}</span>
						{/if}
					</td>
					<td class="priority-cell">-</td>
					<td class="metric-cell">-</td>
					<td class="status-cell">
						{#if rci.approved}
							<span class="badge approved">Approved</span>
						{:else if rci.rejected}
							<span class="badge rejected">Rejected</span>
						{:else}
							<span class="badge pending">Pending</span>
						{/if}
					</td>
					<td class="comments-cell">
						{#if rci.comments}
							<span class="manager-comments">{rci.comments}</span>
						{:else}
							<span class="no-comments">-</span>
						{/if}
					</td>
					<td class="received-from-cell">
						{#if rci.received_from_name}
							<span class="from-name">{rci.received_from_name}{#if rci.received_from_title}, {rci.received_from_title}{/if}</span>
						{:else}
							<span class="not-received">-</span>
						{/if}
					</td>
					<td class="shared-cell">
						{#if filterSharedWith(rci.sharedWith).length > 0}
							<ul class="shared-list">
								{#each filterSharedWith(rci.sharedWith) as share}
									<li>
										<span class="shared-name">{share.to_user_name}</span>
										{#if share.to_user_title}
											<span class="shared-title">{share.to_user_title}</span>
										{/if}
										{#if share.accepted === true}
											<span class="badge accepted small">Accepted</span>
										{:else if share.accepted === false}
											<span class="badge ignored small">Ignored</span>
										{:else}
											<span class="badge waiting small">Pending</span>
										{/if}
									</li>
								{/each}
							</ul>
						{:else}
							<span class="not-shared">-</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

{#if data.groupedCascaded.length > 0 || data.cascadedOrphanRcis.length > 0}
	<h2 class="section-title">Objectives Cascaded Down</h2>
	<p class="section-subtitle">Objectives published to you by your manager</p>
	<table>
		<thead>
			<tr>
				<th>Type</th>
				<th>Name</th>
				<th>Strategic Priority</th>
				<th>Metric</th>
				<th>From</th>
			</tr>
		</thead>
		<tbody>
			{#each data.groupedCascaded as group}
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
					<td class="priority-cell">{group.bigRock.strategic_priority_name || '-'}</td>
					<td class="metric-cell">{group.bigRock.objective_metric || '-'}</td>
					<td class="from-cell">
						<span class="from-name">{group.bigRock.from_user_name}</span>
						{#if group.bigRock.from_user_title}
							<span class="from-title">{group.bigRock.from_user_title}</span>
						{/if}
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
						<td class="priority-cell">-</td>
						<td class="metric-cell">{rci.objective_metric || '-'}</td>
						<td class="from-cell">
							<span class="from-name">{rci.from_user_name}</span>
							{#if rci.from_user_title}
								<span class="from-title">{rci.from_user_title}</span>
							{/if}
						</td>
					</tr>
				{/each}
			{/each}
			<!-- Orphan RCIs (no parent Big Rock in cascaded list) -->
			{#each data.cascadedOrphanRcis as rci}
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
					<td class="priority-cell">-</td>
					<td class="metric-cell">{rci.objective_metric || '-'}</td>
					<td class="from-cell">
						<span class="from-name">{rci.from_user_name}</span>
						{#if rci.from_user_title}
							<span class="from-title">{rci.from_user_title}</span>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
	}

	.header-actions {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.action-form {
		margin: 0;
	}

	.button {
		padding: 0.5rem 1rem;
		background: #0066cc;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-size: 0.875rem;
	}

	.button:hover {
		background: #0052a3;
	}

	.publish-button {
		padding: 0.5rem 1rem;
		background: #28a745;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.publish-button:hover {
		background: #218838;
	}

	.approval-button {
		padding: 0.5rem 1rem;
		background: #fd7e14;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.approval-button:hover {
		background: #e67112;
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
	}

	.empty p {
		color: #666;
		margin-bottom: 1rem;
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

	.name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.name-cell a {
		color: #0066cc;
		text-decoration: none;
	}

	.name-cell a:hover {
		text-decoration: underline;
	}

	.description {
		display: block;
		font-weight: 400;
		font-size: 0.875rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.lock-icon {
		color: #666;
		display: inline-flex;
		align-items: center;
	}

	.lock-icon svg {
		flex-shrink: 0;
	}

	.priority-cell, .metric-cell {
		color: #666;
	}

	.status-cell {
		min-width: 80px;
	}

	.received-from-cell {
		min-width: 150px;
	}

	.from-name {
		color: #333;
	}

	.not-received {
		color: #999;
	}

	.shared-cell {
		min-width: 150px;
	}

	.shared-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.shared-list li {
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid #f0f0f0;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.shared-list li:last-child {
		margin-bottom: 0;
		padding-bottom: 0;
		border-bottom: none;
	}

	.shared-name {
		font-weight: 500;
		color: #333;
	}

	.shared-title {
		font-size: 0.75rem;
		color: #666;
	}

	.not-shared {
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
		margin-top: 0.25rem;
		align-self: flex-start;
	}

	.badge.approved {
		background: #e6f4ea;
		color: #1e7e34;
	}

	.badge.pending {
		background: #fff3cd;
		color: #856404;
	}

	.badge.accepted {
		background: #e6f4ea;
		color: #1e7e34;
	}

	.badge.ignored {
		background: #f8d7da;
		color: #721c24;
	}

	.badge.waiting {
		background: #e2e3e5;
		color: #383d41;
	}

	.badge.rejected {
		background: #f8d7da;
		color: #721c24;
	}

	.comments-cell {
		min-width: 150px;
		max-width: 200px;
	}

	.manager-comments {
		font-size: 0.875rem;
		color: #666;
		font-style: italic;
	}

	.no-comments {
		color: #999;
	}

	.section-title {
		margin-top: 2.5rem;
		margin-bottom: 0.5rem;
		font-size: 1.25rem;
	}

	.section-subtitle {
		color: #666;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.objective-name {
		display: block;
		color: #333;
		font-weight: 500;
	}

	.from-cell {
		min-width: 150px;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.from-title {
		font-size: 0.75rem;
		color: #666;
	}
</style>
