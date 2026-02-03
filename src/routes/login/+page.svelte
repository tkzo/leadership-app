<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
</script>

<svelte:head>
	<title>Login - Leadership App</title>
</svelte:head>

<div class="container">
	<h1>Login</h1>

	{#if form?.error}
		<div class="error">{form.error}</div>
	{/if}

	<form method="POST" use:enhance>
		<div class="field">
			<label for="email">Email</label>
			<input
				type="email"
				id="email"
				name="email"
				value={form?.email ?? ''}
				required
			/>
		</div>

		<div class="field">
			<label for="password">Password</label>
			<input type="password" id="password" name="password" required />
		</div>

		<button type="submit">Login</button>
	</form>

	<p class="links">
		<a href="/forgot-password">Forgot password?</a>
	</p>
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

	input {
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

	.links {
		margin-top: 1rem;
		text-align: center;
	}

	.links a {
		color: #0066cc;
	}
</style>
