<script lang="ts">
	import type { CollabUser } from '$lib/stores/timeline-collab.svelte';

	let { users = [] }: { users: CollabUser[] } = $props();
</script>

{#each users as user (user.clientId)}
	{#if user.cursor}
		<div
			class="pointer-events-none fixed z-50 transition-all duration-75 ease-out"
			style="left: {user.cursor.x}px; top: {user.cursor.y}px;"
		>
			<!-- SVG Cursor Icon -->
			<svg
				class="w-5 h-5 drop-shadow-md"
				viewBox="0 0 24 24"
				fill={user.color}
				stroke="black"
				stroke-width="1.5"
			>
				<path d="M5.653 4.116a1 1 0 0 0-1.506 1.137l5.5 14.5a1 1 0 0 0 1.834-.04l2.483-5.795 5.795-2.483a1 1 0 0 0 .04-1.834l-14.5-5.5Z" />
			</svg>
			<!-- Name Badge -->
			<div
				class="ml-3 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md whitespace-nowrap"
				style="background-color: {user.color};"
			>
				{user.name}
			</div>
		</div>
	{/if}
{/each}
