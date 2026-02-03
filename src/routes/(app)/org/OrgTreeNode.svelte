<script lang="ts">
	interface OrgNode {
		uid: string;
		name: string;
		title: string | null;
		level: number;
		email: string;
		children: OrgNode[];
	}

	export let node: OrgNode;
	export let expandedNodes: Set<string>;
	export let toggleNode: (uid: string) => void;
	export let levelColors: Record<number, string>;
	export let isRoot: boolean = false;

	$: isExpanded = expandedNodes.has(node.uid);
	$: levelColor = levelColors[node.level] || '#666';
</script>

<div class="tree-node" class:root={isRoot}>
	<div class="node-content">
		{#if node.children.length > 0}
			<button class="toggle-btn" on:click={() => toggleNode(node.uid)}>
				{isExpanded ? '−' : '+'}
			</button>
		{:else}
			<span class="toggle-placeholder"></span>
		{/if}
		<div class="node-card">
			<span class="level-indicator" style="background-color: {levelColor}"></span>
			<div class="node-info">
				<span class="node-name">{node.name}</span>
				{#if node.title}
					<span class="node-title">{node.title}</span>
				{/if}
				<span class="node-level">Level {node.level}</span>
			</div>
			{#if node.children.length > 0}
				<span class="children-count">{node.children.length} direct report{node.children.length === 1 ? '' : 's'}</span>
			{/if}
		</div>
	</div>
	{#if node.children.length > 0 && isExpanded}
		<div class="children">
			{#each node.children as child}
				<svelte:self node={child} {expandedNodes} {toggleNode} {levelColors} isRoot={false} />
			{/each}
		</div>
	{/if}
</div>

<style>
	.tree-node {
		position: relative;
	}

	.tree-node.root {
		margin-bottom: 1rem;
	}

	.tree-node.root:last-child {
		margin-bottom: 0;
	}

	.node-content {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
	}

	.toggle-btn {
		width: 24px;
		height: 24px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f0f0f0;
		border: 1px solid #ddd;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: bold;
		color: #666;
		flex-shrink: 0;
		margin-top: 0.5rem;
	}

	.toggle-btn:hover {
		background: #e0e0e0;
	}

	.toggle-placeholder {
		width: 24px;
		flex-shrink: 0;
	}

	.node-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		background: #fafafa;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		flex: 1;
		max-width: 400px;
	}

	.level-indicator {
		width: 4px;
		height: 40px;
		border-radius: 2px;
		flex-shrink: 0;
	}

	.node-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		flex: 1;
	}

	.node-name {
		font-weight: 600;
		color: #333;
	}

	.node-title {
		font-size: 0.875rem;
		color: #666;
	}

	.node-level {
		font-size: 0.75rem;
		color: #888;
	}

	.children-count {
		font-size: 0.75rem;
		color: #888;
		background: #f0f0f0;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		white-space: nowrap;
	}

	.children {
		margin-left: 2.5rem;
		padding-left: 1rem;
		border-left: 2px solid #e0e0e0;
		margin-top: 0.5rem;
	}

	.children :global(.tree-node) {
		margin-bottom: 0.5rem;
	}

	.children :global(.tree-node:last-child) {
		margin-bottom: 0;
	}
</style>
