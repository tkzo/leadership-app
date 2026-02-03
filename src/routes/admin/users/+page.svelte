<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Users - Admin - Leadership App</title>
</svelte:head>

<div class="header">
	<h1>Users</h1>
	<a href="/admin/users/new" class="button">Add User</a>
</div>

<table>
	<thead>
		<tr>
			<th>Name</th>
			<th>Email</th>
			<th>Title</th>
			<th>Level</th>
			<th>Admin</th>
			<th>Verified</th>
		</tr>
	</thead>
	<tbody>
		{#each data.users as user}
			<tr>
				<td>{user.name}</td>
				<td>{user.email}</td>
				<td>{user.title || '-'}</td>
				<td>{user.level}</td>
				<td>{user.admin ? 'Yes' : 'No'}</td>
				<td>{user.email_verified ? 'Yes' : 'No'}</td>
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
		text-decoration: none;
		border-radius: 4px;
	}

	.button:hover {
		background: #0052a3;
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
</style>
