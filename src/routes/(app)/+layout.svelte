<script lang="ts">
	import { enhance } from '$app/forms';
	import type { LayoutData } from './$types';

	export let data: LayoutData;
</script>

<div class="app-layout">
	<header class="app-header">
		<div class="logo">Leadership App</div>
		<nav>
			<a href="/">Dashboard</a>
			<a href="/objectives">My Objectives</a>
			<a href="/shared">Approval Requests</a>
			<a href="/org">Organization</a>
			{#if data.hasReportees}
				<a href="/team">Team Objectives</a>
			{/if}
			{#if data.hasReportees}
				<a href="/approvals">Approvals</a>
			{/if}
			{#if data.user.admin}
				<a href="/admin">Admin</a>
			{/if}
		</nav>
		<div class="user-info">
			<span>{data.user.name}</span>
			<form method="POST" action="/logout" use:enhance>
				<button type="submit">Logout</button>
			</form>
		</div>
	</header>
	<main class="app-content">
		<slot />
	</main>
</div>

<style>
	.app-layout {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}

	.app-header {
		display: flex;
		align-items: center;
		padding: 0 1.5rem;
		height: 60px;
		background: #1a1a2e;
		color: white;
	}

	.logo {
		font-weight: 600;
		font-size: 1.125rem;
		margin-right: 2rem;
	}

	nav {
		display: flex;
		gap: 1.5rem;
		flex: 1;
	}

	nav a {
		color: rgba(255, 255, 255, 0.8);
		text-decoration: none;
	}

	nav a:hover {
		color: white;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info span {
		color: rgba(255, 255, 255, 0.8);
	}

	.user-info button {
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		padding: 0.375rem 0.75rem;
		border-radius: 4px;
		cursor: pointer;
	}

	.user-info button:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.app-content {
		flex: 1;
		padding: 2rem;
	}
</style>
