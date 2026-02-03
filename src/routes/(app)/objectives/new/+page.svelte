<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let selectedType = 'big_rock';
</script>

<svelte:head>
	<title>New Objective - Leadership App</title>
</svelte:head>

<h1>Create New Objective</h1>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

<form method="POST" use:enhance>
	<div class="field">
		<label for="name">Name *</label>
		<input type="text" id="name" name="name" required />
	</div>

	<div class="field">
		<label for="type">Type *</label>
		<select id="type" name="type" bind:value={selectedType} required>
			<option value="big_rock">Big Rock</option>
			<option value="risk_critical_initiative">Risk Critical Initiative</option>
		</select>
	</div>

	{#if selectedType === 'big_rock'}
		<div class="field">
			<label for="strategicPriorityId">Strategic Priority</label>
			<select id="strategicPriorityId" name="strategicPriorityId">
				<option value="">None</option>
				{#each data.priorities as priority}
					<option value={priority.id}>{priority.name}</option>
				{/each}
			</select>
		</div>
	{:else if data.bigRocks.length > 0}
		<div class="field">
			<label for="parentId">Parent Big Rock</label>
			<select id="parentId" name="parentId">
				<option value="">None</option>
				{#each data.bigRocks as bigRock}
					<option value={bigRock.id}>{bigRock.name}</option>
				{/each}
			</select>
		</div>
	{/if}

	<div class="field">
		<label for="description">Description</label>
		<textarea id="description" name="description" rows="4"></textarea>
	</div>

	{#if selectedType === 'big_rock'}
		<div class="field">
			<label for="metric">Success Metric</label>
			<input type="text" id="metric" name="metric" placeholder="How will success be measured?" />
		</div>
	{/if}

	<div class="actions">
		<a href="/objectives" class="cancel">Cancel</a>
		<button type="submit">Create Objective</button>
	</div>
</form>

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

	form {
		max-width: 600px;
	}

	.field {
		margin-bottom: 1.25rem;
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

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 1.5rem;
	}

	.cancel {
		padding: 0.75rem 1.5rem;
		background: #f5f5f5;
		color: #333;
		text-decoration: none;
		border-radius: 4px;
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
</style>
