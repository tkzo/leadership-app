<script lang="ts">
	import type { LayoutData } from './$types';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<div class="admin-layout">
	<nav class="admin-nav">
		<h2>Admin</h2>
		<ul>
			<li><a href="/admin/users">Users</a></li>
			<li><a href="/admin/strategic-priorities">Strategic Priorities</a></li>
		</ul>
		<hr />
		<ul>
			<li><a href="/">Back to App</a></li>
		</ul>
	</nav>
	<main class="admin-content">
		{@render children()}
	</main>
</div>

<style>
	.admin-layout {
		display: flex;
		min-height: 100vh;
	}

	.admin-nav {
		width: 200px;
		padding: 1rem;
		background: #f5f5f5;
		border-right: 1px solid #ddd;
	}

	.admin-nav h2 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
	}

	.admin-nav ul {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.admin-nav li {
		margin-bottom: 0.5rem;
	}

	.admin-nav a {
		color: #333;
		text-decoration: none;
	}

	.admin-nav a:hover {
		color: #0066cc;
	}

	.admin-nav hr {
		margin: 1rem 0;
		border: none;
		border-top: 1px solid #ddd;
	}

	.admin-content {
		flex: 1;
		padding: 2rem;
	}
</style>
