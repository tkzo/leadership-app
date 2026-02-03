<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';

	export let data: PageData;
	export let form: ActionData;
</script>

<svelte:head>
	<title>Reset Password - Leadership App</title>
</svelte:head>

<div class="container">
	<h1>Reset Password</h1>

	{#if data.error}
		<div class="error">{data.error}</div>
		<p><a href="/forgot-password">Request a new reset link</a></p>
	{:else}
		{#if form?.error}
			<div class="error">{form.error}</div>
		{/if}

		<form method="POST" use:enhance>
			<input type="hidden" name="token" value={data.token} />

			<div class="field">
				<label for="password">New Password</label>
				<input type="password" id="password" name="password" required minlength="8" />
			</div>

			<div class="field">
				<label for="confirmPassword">Confirm Password</label>
				<input type="password" id="confirmPassword" name="confirmPassword" required minlength="8" />
			</div>

			<button type="submit">Reset Password</button>
		</form>
	{/if}
</div>

<style>
	.container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
	}

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

	.field {
		margin-bottom: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.25rem;
		font-weight: 500;
	}

	input[type="password"] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;
	}

	button {
		width: 100%;
		padding: 0.75rem;
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

	a {
		color: #0066cc;
	}
</style>
