<script lang="ts">
	import type { PageData } from './$types';
	import OrgTreeNode from './OrgTreeNode.svelte';

	export let data: PageData;

	let expandedNodes = new Set<string>();

	function expandAllNodes(nodes: typeof data.orgTree) {
		for (const node of nodes) {
			expandedNodes.add(node.uid);
			if (node.children.length > 0) {
				expandAllNodes(node.children);
			}
		}
		expandedNodes = expandedNodes;
	}

	function collapseAll() {
		expandedNodes = new Set();
	}

	function toggleNode(uid: string) {
		if (expandedNodes.has(uid)) {
			expandedNodes.delete(uid);
		} else {
			expandedNodes.add(uid);
		}
		expandedNodes = expandedNodes;
	}

	// Expand all on initial load
	$: if (data?.orgTree && expandedNodes.size === 0) {
		expandAllNodes(data.orgTree);
	}

	const levelColors: Record<number, string> = {
		1: '#1a73e8',
		2: '#34a853',
		3: '#fbbc04',
		4: '#ea4335',
		5: '#9334e6'
	};
</script>

<svelte:head>
	<title>Organization - Leadership App</title>
</svelte:head>

<div class="header">
	<div>
		<h1>Organization</h1>
		<p class="subtitle">{data.totalUsers} team members</p>
	</div>
	<div class="controls">
		<button on:click={() => expandAllNodes(data.orgTree)} class="control-btn">Expand All</button>
		<button on:click={collapseAll} class="control-btn">Collapse All</button>
	</div>
</div>

<div class="legend">
	{#each Object.entries(levelColors) as [level, color]}
		<span class="legend-item">
			<span class="legend-dot" style="background-color: {color}"></span>
			Level {level}
		</span>
	{/each}
</div>

{#if data.orgTree.length === 0}
	<div class="empty">
		<p>No users found in the organization.</p>
	</div>
{:else}
	<div class="org-tree">
		{#each data.orgTree as node}
			<OrgTreeNode {node} {expandedNodes} {toggleNode} {levelColors} isRoot={true} />
		{/each}
	</div>
{/if}

<style>
	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1.5rem;
	}

	h1 {
		margin: 0;
	}

	.subtitle {
		color: #666;
		margin: 0.25rem 0 0;
	}

	.controls {
		display: flex;
		gap: 0.5rem;
	}

	.control-btn {
		padding: 0.5rem 1rem;
		background: #f5f5f5;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875rem;
	}

	.control-btn:hover {
		background: #e5e5e5;
	}

	.legend {
		display: flex;
		gap: 1.5rem;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		background: #f9f9f9;
		border-radius: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: #666;
	}

	.legend-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}

	.empty {
		text-align: center;
		padding: 3rem;
		background: #f9f9f9;
		border-radius: 8px;
		color: #666;
	}

	.org-tree {
		background: white;
		border-radius: 8px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
</style>
