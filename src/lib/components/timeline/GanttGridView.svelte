<script lang="ts">
	import type { TimelineEventData } from '$lib/stores/timeline-collab.svelte';
	import { formatYear } from '$lib/utils/timeline-time';

	let {
		events = [],
		zoomLevel = 1,
		onSelectEvent
	}: {
		events: TimelineEventData[];
		zoomLevel: number;
		onSelectEvent: (event: TimelineEventData) => void;
	} = $props();

	// Min and max years
	let minYear = $derived.by(() => {
		if (events.length === 0) return 2000;
		return Math.min(...events.map((e) => e.startYear)) - 2;
	});

	let maxYear = $derived.by(() => {
		if (events.length === 0) return 2030;
		return Math.max(...events.map((e) => (e.isSpan && e.endYear ? e.endYear : e.startYear))) + 3;
	});

	let totalYears = $derived(Math.max(10, maxYear - minYear));
	let pxPerYear = $derived(Math.max(25, 45 * zoomLevel));
	let gridWidth = $derived(totalYears * pxPerYear);

	// Years array for header ticks
	let yearHeaders = $derived.by(() => {
		const step = pxPerYear < 35 ? 5 : pxPerYear < 70 ? 2 : 1;
		const list: number[] = [];
		for (let y = minYear; y <= maxYear; y += step) {
			list.push(y);
		}
		return list;
	});
</script>

<div class="flex-1 w-full h-full overflow-auto bg-slate-950 flex flex-col select-none">
	<!-- Gantt Table Container -->
	<div class="min-w-max flex flex-col flex-1">
		<!-- Header Row: Titles on left, Time Ruler on right -->
		<div class="flex items-center h-12 bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
			<div class="w-64 flex-shrink-0 px-4 font-bold text-xs text-slate-400 border-r border-slate-800 uppercase tracking-wider">
				Item / Epoch
			</div>
			<div class="relative h-full flex-1" style="width: {gridWidth}px;">
				{#each yearHeaders as yr}
					{@const left = (yr - minYear) * pxPerYear}
					<div
						class="absolute top-0 bottom-0 flex flex-col justify-end pb-1 border-l border-slate-800 px-1.5"
						style="left: {left}px;"
					>
						<span class="text-[11px] font-mono text-slate-400 font-medium">
							{formatYear(yr)}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Rows -->
		<div class="divide-y divide-slate-800/60 flex-1">
			{#if events.length === 0}
				<div class="p-8 text-center text-slate-500 text-xs">No events to display in Gantt grid.</div>
			{/if}

			{#each events as evt (evt.id)}
				{@const left = (evt.startYear - minYear) * pxPerYear}
				{@const duration = evt.isSpan && evt.endYear ? Math.max(0.5, evt.endYear - evt.startYear) : 0.5}
				{@const barWidth = Math.max(24, duration * pxPerYear)}

				<div
					onclick={() => onSelectEvent(evt)}
					onkeydown={(e) => e.key === 'Enter' && onSelectEvent(evt)}
					role="button"
					tabindex="0"
					class="flex items-center h-12 hover:bg-slate-900/50 transition-colors cursor-pointer group"
				>
					<!-- Left Label -->
					<div class="w-64 flex-shrink-0 px-4 flex items-center justify-between gap-2 border-r border-slate-800">
						<span class="text-xs font-semibold text-white group-hover:text-indigo-300 truncate">
							{evt.title}
						</span>
						<span class="text-[10px] font-mono text-slate-500 flex-shrink-0">
							{formatYear(evt.startYear)}
						</span>
					</div>

					<!-- Right Timeline Grid Track -->
					<div class="relative h-full flex-1" style="width: {gridWidth}px;">
						<!-- Vertical grid background lines -->
						{#each yearHeaders as yr}
							{@const gridX = (yr - minYear) * pxPerYear}
							<div class="absolute top-0 bottom-0 border-l border-slate-900/80 pointer-events-none" style="left: {gridX}px;"></div>
						{/each}

						<!-- Event Gantt Bar or Milestone -->
						{#if evt.isSpan}
							<div
								class="absolute top-2 bottom-2 rounded-lg shadow-md flex items-center px-2.5 transition-all group-hover:brightness-110"
								style="left: {left}px; width: {barWidth}px; background-color: {evt.color || '#6366f1'};"
							>
								<span class="text-[11px] font-bold text-white truncate drop-shadow">
									{evt.title}
								</span>
							</div>
						{:else}
							<!-- Milestone Diamond -->
							<div
								class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rotate-45 rounded-sm shadow-md transition-all group-hover:scale-125"
								style="left: {left}px; background-color: {evt.color || '#6366f1'};"
								title="{evt.title} ({formatYear(evt.startYear)})"
							></div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
