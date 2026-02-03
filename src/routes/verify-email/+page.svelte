<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Verify Email - Leadership App</title>
</svelte:head>

<div class="container">
	{#if data.pending}
		<h1>Check Your Email</h1>
		<p>We've sent you a verification email. Please click the link in the email to verify your account.</p>
		<p><a href="/login">Back to Login</a></p>
	{:else if data.error}
		<h1>Verification Failed</h1>
		<div class="error">{data.error}</div>
		<p><a href="/login">Back to Login</a></p>
	{/if}
</div>

<style>
	.container {
		max-width: 400px;
		margin: 2rem auto;
		padding: 2rem;
		text-align: center;
	}

	.error {
		background: #fee;
		border: 1px solid #f00;
		color: #c00;
		padding: 0.75rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	a {
		color: #0066cc;
	}
</style>
