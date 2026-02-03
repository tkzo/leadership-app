<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;

	let editingId: string | null = null;
	let showAddForm = false;
</script>

<svelte:head>
	<title>Strategic Priorities - Admin - Leadership App</title>
</svelte:head>

<div class="header">
	<h1>Strategic Priorities</h1>
	<button class="button" on:click={() => (showAddForm = !showAddForm)}>
		{showAddForm ? 'Cancel' : 'Add Priority'}
	</button>
</div>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

{#if showAddForm}
	<div class="add-form">
		<h2>Add New Priority</h2>
		<form method="POST" action="?/create" use:enhance={() => {
			return async ({ update }) => {
				await update();
				showAddForm = false;
			};
		}}>
			<div class="field">
				<label for="name">Name *</label>
				<input type="text" id="name" name="name" required />
			</div>
			<div class="field">
				<label for="description">Description</label>
				<textarea id="description" name="description" rows="3"></textarea>
			</div>
			<button type="submit">Add Priority</button>
		</form>
	</div>
{/if}

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Description</th>
			<th>Actions</th>
		</tr>
	</thead>
	<tbody>
		{#each data.priorities as priority}
			<tr>
				{#if editingId === priority.id}
					<td colspan="3">
						<form method="POST" action="?/update" use:enhance={() => {
							return async ({ update }) => {
								await update();
								editingId = null;
							};
						}}>
							<input type="hidden" name="id" value={priority.id} />
							<div class="edit-row">
								<input type="text" name="name" value={priority.name} required />
								<input type="text" name="description" value={priority.description || ''} />
								<button type="submit">Save</button>
								<button type="button" on:click={() => (editingId = null)}>Cancel</button>
							</div>
						</form>
					</td>
				{:else}
					<td>{priority.name}</td>
					<td>{priority.description || '-'}</td>
					<td class="actions">
						<button class="link" on:click={() => (editingId = priority.id)}>Edit</button>
						<form method="POST" action="?/delete" use:enhance style="display: inline;">
							<input type="hidden" name="id" value={priority.id} />
							<button type="submit" class="link danger">Delete</button>
						</form>
					</td>
				{/if}
			</tr>
		{/each}
	</tbody>
</table>

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

	.button {
		padding: 0.5rem 1rem;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.button:hover {
		background: #0052a3;
	}

	.error {
		background: #fee;
		border: 1px solid #f00;
		color: #c00;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.add-form {
		background: #f9f9f9;
		padding: 1.5rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}

	.add-form h2 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
	}

	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input[type="text"],
	textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	.add-form button {
		padding: 0.5rem 1rem;
		background: #0066cc;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.75rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
	}

	tr:hover {
		background: #fafafa;
	}

	.actions {
		white-space: nowrap;
	}

	.edit-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
	}

	.edit-row input {
		flex: 1;
	}

	button.link {
		background: none;
		border: none;
		color: #0066cc;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}

	button.link:hover {
		text-decoration: underline;
	}

	button.link.danger {
		color: #c00;
	}
</style>
