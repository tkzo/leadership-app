<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<svelte:head>
	<title>Add User - Admin - Leadership App</title>
</svelte:head>

<h1>Add User</h1>

{#if form?.error}
	<div class="error">{form.error}</div>
{/if}

<form method="POST" use:enhance>
	<div class="field">
		<label for="name">Name *</label>
		<input type="text" id="name" name="name" required />
	</div>

	<div class="field">
		<label for="email">Email *</label>
		<input type="email" id="email" name="email" required />
	</div>

	<div class="field">
		<label for="password">Password *</label>
		<input type="password" id="password" name="password" required minlength="8" />
		<small>Minimum 8 characters</small>
	</div>

	<div class="field">
		<label for="title">Title</label>
		<input type="text" id="title" name="title" />
	</div>

	<div class="field">
		<label for="level">Level *</label>
		<select id="level" name="level" required>
			<option value="1">Level 1</option>
			<option value="2">Level 2</option>
			<option value="3">Level 3</option>
			<option value="4">Level 4</option>
			<option value="5">Level 5</option>
		</select>
	</div>

	<div class="field">
		<label for="managerId">Manager</label>
		<select id="managerId" name="managerId">
			<option value="">No Manager</option>
			{#each data.managers as manager}
				<option value={manager.uid}>{manager.name}</option>
			{/each}
		</select>
	</div>

	<div class="field checkbox">
		<label>
			<input type="checkbox" name="admin" />
			Admin privileges
		</label>
	</div>

	<div class="actions">
		<a href="/admin/users" class="cancel">Cancel</a>
		<button type="submit">Create User</button>
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
		max-width: 500px;
	}

	.field {
		margin-bottom: 1rem;
	}

	.field.checkbox {
		margin-top: 1.5rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	.checkbox label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
	}

	input[type="text"],
	input[type="email"],
	input[type="password"],
	select {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	small {
		color: #666;
		font-size: 0.875rem;
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
