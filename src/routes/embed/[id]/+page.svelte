<script lang="ts">
	import HorizontalBandView from '$lib/components/timeline/HorizontalBandView.svelte';
	import VerticalStoryFeedView from '$lib/components/timeline/VerticalStoryFeedView.svelte';
	import GanttGridView from '$lib/components/timeline/GanttGridView.svelte';
	import EventDialog from '$lib/components/timeline/EventDialog.svelte';
	import type { TimelineEventData } from '$lib/stores/timeline-collab.svelte';
	import { Maximize2, SlidersHorizontal, LayoutList, Kanban } from 'lucide-svelte';

	let { data } = $props();

	let viewMode = $state<'horizontal' | 'vertical' | 'gantt'>('horizontal');
	$effect(() => {
		if (data.timeline.defaultView) {
			viewMode = data.timeline.defaultView as any;
		}
	});
	let zoomLevel = $state(1);
	let panX = $state(0);
	let selectedEvent = $state<TimelineEventData | null>(null);
	let isDialogOpen = $state(false);

	function handleSelectEvent(evt: TimelineEventData) {
		selectedEvent = evt;
		isDialogOpen = true;
	}
</script>

<div class="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
	<!-- Minimal Header -->
	<header class="h-10 border-b border-slate-800/80 bg-slate-900/80 px-4 flex items-center justify-between z-20">
		<div class="flex items-center gap-2">
			<span class="text-xs font-bold text-white">{data.timeline.title}</span>
			<span class="text-[10px] text-slate-500">via EpochForge</span>
		</div>

		<div class="flex items-center gap-1.5">
			<button
				type="button"
				onclick={() => (viewMode = 'horizontal')}
				class="p-1 rounded text-slate-400 hover:text-white {viewMode === 'horizontal' ? 'bg-indigo-600 text-white' : ''}"
				title="Horizontal View"
			>
				<SlidersHorizontal class="w-3 h-3" />
			</button>
			<button
				type="button"
				onclick={() => (viewMode = 'vertical')}
				class="p-1 rounded text-slate-400 hover:text-white {viewMode === 'vertical' ? 'bg-indigo-600 text-white' : ''}"
				title="Story Feed"
			>
				<LayoutList class="w-3 h-3" />
			</button>
			<button
				type="button"
				onclick={() => (viewMode = 'gantt')}
				class="p-1 rounded text-slate-400 hover:text-white {viewMode === 'gantt' ? 'bg-indigo-600 text-white' : ''}"
				title="Gantt Grid"
			>
				<Kanban class="w-3 h-3" />
			</button>
		</div>
	</header>

	<main class="flex-1 w-full h-full relative overflow-hidden flex flex-col">
		{#if viewMode === 'horizontal'}
			<HorizontalBandView
				events={data.events}
				bind:zoomLevel
				bind:panX
				onSelectEvent={handleSelectEvent}
			/>
		{:else if viewMode === 'vertical'}
			<VerticalStoryFeedView
				events={data.events}
				onSelectEvent={handleSelectEvent}
			/>
		{:else if viewMode === 'gantt'}
			<GanttGridView
				events={data.events}
				{zoomLevel}
				onSelectEvent={handleSelectEvent}
			/>
		{/if}
	</main>

	<!-- Read-only Event Dialog for Embed -->
	<EventDialog
		bind:isOpen={isDialogOpen}
		initialEvent={selectedEvent}
		onSave={() => {}}
	/>
</div>
