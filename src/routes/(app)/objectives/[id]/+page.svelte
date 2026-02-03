<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	$: isEditable = !data.objective.approved && !data.isLocked;
	$: canShare = data.sameLevelUsers.length > 0;

	let editType = data.objective.type;
	$: if (data.objective) editType = data.objective.type;
</script>

<svelte:head>
	<title>{data.objective.name} - Leadership App</title>
</svelte:head>

<div class="header">
	<div>
		<a href="/objectives" class="back">Back to Objectives</a>
		<div class="title-row">
			<h1>{data.objective.name}</h1>
			{#if data.isLocked}
				<span class="lock-icon" title="Locked - has been shared/published">
					<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
						<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
					</svg>
				</span>
			{/if}
		</div>
		<div class="meta">
			<span class="type">{data.objective.type === 'big_rock' ? 'Big Rock' : 'Risk Critical Initiative'}</span>
			{#if data.objective.approved}
				<span class="badge approved">Approved</span>
			{:else}
				<span class="badge pending">Pending Approval</span>
			{/if}
		</div>
	</div>
</div>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if form?.success}
	<div class="success">Objective updated successfully.</div>
{/if}

{#if form?.shared}
	<div class="success">Shared with {form.recipientCount} colleague(s).</div>
{/if}

<div class="content">
	{#if isEditable}
		<form method="POST" action="?/update" use:enhance class="edit-form">
			<div class="field">
				<label for="name">Name *</label>
				<input type="text" id="name" name="name" value={data.objective.name} required />
			</div>

			<div class="field">
				<label for="type">Type *</label>
				<select id="type" name="type" bind:value={editType} required>
					<option value="big_rock">Big Rock</option>
					<option value="risk_critical_initiative">Risk Critical Initiative</option>
				</select>
			</div>

			{#if editType === 'big_rock'}
				<div class="field">
					<label for="strategicPriorityId">Strategic Priority</label>
					<select id="strategicPriorityId" name="strategicPriorityId">
						<option value="">None</option>
						{#each data.priorities as priority}
							<option value={priority.id} selected={data.objective.strategic_priority_id === priority.id}>{priority.name}</option>
						{/each}
					</select>
				</div>
			{:else if data.bigRocks.length > 0}
				<div class="field">
					<label for="parentId">Parent Big Rock</label>
					<select id="parentId" name="parentId">
						<option value="">None</option>
						{#each data.bigRocks as bigRock}
							<option value={bigRock.id} selected={data.objective.parent_id === bigRock.id}>{bigRock.name}</option>
						{/each}
					</select>
				</div>
			{/if}

			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="4">{data.objective.description || ''}</textarea>
			</div>

			{#if editType === 'big_rock'}
				<div class="field">
					<label for="metric">Success Metric</label>
					<input type="text" id="metric" name="metric" value={data.objective.metric || ''} />
				</div>
			{/if}

			<div class="form-actions">
				<button type="submit">Save Changes</button>
			</div>
		</form>
		<form method="POST" action="?/delete" use:enhance class="delete-form">
			<button type="submit" class="danger">Delete Objective</button>
		</form>
	{:else}
		<div class="view-only">
			<div class="field-view">
				<label>Description</label>
				<p>{data.objective.description || 'No description'}</p>
			</div>

			{#if data.objective.type === 'big_rock'}
				<div class="field-view">
					<label>Success Metric</label>
					<p>{data.objective.metric || 'No metric defined'}</p>
				</div>
			{/if}

			{#if data.objective.comments}
				<div class="field-view">
					<label>Manager Comments</label>
					<p>{data.objective.comments}</p>
				</div>
			{/if}

			{#if data.isLocked}
				<p class="locked-notice">This objective has been shared or published and cannot be edited.</p>
			{:else if data.objective.approved}
				<p class="locked-notice">This objective has been approved and cannot be edited.</p>
			{/if}
		</div>
	{/if}

	<div class="action-section">
		<h2>Share with Colleagues</h2>
		{#if canShare}
			<p>Share this objective with colleagues at your level.</p>
			<form method="POST" action="?/share" use:enhance>
				<div class="checkbox-list">
					{#each data.sameLevelUsers as user}
						<label>
							<input type="checkbox" name="recipientIds" value={user.uid} />
							{user.name}
						</label>
					{/each}
				</div>
				<button type="submit">Share with Selected</button>
			</form>
		{:else}
			<p class="no-recipients">No colleagues available. Either there are no users at your level, or all have already received this objective.</p>
		{/if}
	</div>
</div>

<style>
	.header {
		margin-bottom: 1.5rem;
	}

	.back {
		color: #666;
		text-decoration: none;
		font-size: 0.875rem;
	}

	.back:hover {
		color: #0066cc;
	}

	h1 {
		margin: 0.5rem 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.lock-icon {
		color: #666;
		display: inline-flex;
		align-items: center;
	}

	.meta {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.type {
		color: #666;
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

	.content {
		max-width: 700px;
	}

	.edit-form, .view-only {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.field {
		margin-bottom: 1.25rem;
	}

	.field-view {
		margin-bottom: 1.5rem;
	}

	.field-view label {
		font-weight: 600;
		color: #666;
		font-size: 0.875rem;
		margin-bottom: 0.25rem;
		display: block;
	}

	.field-view p {
		margin: 0;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input[type="text"],
	select,
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	textarea {
		resize: vertical;
	}

	.form-actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.delete-form {
		margin: 0;
	}

	button {
		padding: 0.75rem 1.5rem;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
	}

	button:hover {
		background: #0052a3;
	}

	button.danger {
		background: #dc3545;
	}

	button.danger:hover {
		background: #c82333;
	}

	.locked-notice {
		color: #666;
		font-style: italic;
		margin-top: 1rem;
	}

	.action-section {
		background: white;
		border: 1px solid #ddd;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.action-section h2 {
		margin: 0 0 0.5rem 0;
		font-size: 1.125rem;
	}

	.action-section p {
		color: #666;
		margin-bottom: 1rem;
	}

	.checkbox-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.checkbox-list label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
	}

	.no-recipients {
		color: #888;
		font-style: italic;
	}
</style>
