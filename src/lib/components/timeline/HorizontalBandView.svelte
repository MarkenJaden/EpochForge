<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimelineEventData } from '$lib/stores/timeline-collab.svelte';
	import {
		formatYear,
		calculateTickInterval,
		dateToFractionalYear,
		formatEventDisplayDate,
		generateAdaptiveRulerTicks
	} from '$lib/utils/timeline-time';
	import { Tag, Sparkles } from 'lucide-svelte';

	let {
		events = [],
		zoomLevel = $bindable(1),
		panX = $bindable(0),
		onSelectEvent,
		onCursorMove
	}: {
		events: TimelineEventData[];
		zoomLevel: number;
		panX: number;
		onSelectEvent: (event: TimelineEventData) => void;
		onCursorMove?: (x: number, y: number) => void;
	} = $props();

	let containerEl: HTMLDivElement | null = $state(null);
	let containerWidth = $state(1200);
	let isDragging = $state(false);
	let startDragX = $state(0);
	let startPanX = $state(0);

	// Baseline constants
	const BASE_PX_PER_YEAR = 40; // 40px per year at zoomLevel 1

	let pxPerYear = $derived(BASE_PX_PER_YEAR * zoomLevel);

	// Fractional coordinates for events
	let eventCoordinates = $derived(
		events.map((e) => {
			const startFrac = dateToFractionalYear(e.startYear, e.startDate);
			const endFrac = e.isSpan && e.endYear ? dateToFractionalYear(e.endYear, e.endDate) : startFrac;
			return {
				event: e,
				startFrac,
				endFrac
			};
		})
	);

	// Determine min and max years across events
	let minYear = $derived.by(() => {
		if (eventCoordinates.length === 0) return 2000;
		return Math.min(...eventCoordinates.map((e) => e.startFrac)) - 5;
	});

	let maxYear = $derived.by(() => {
		if (eventCoordinates.length === 0) return 2030;
		return Math.max(...eventCoordinates.map((e) => (e.event.isSpan ? e.endFrac : e.startFrac))) + 5;
	});

	// Convert year to pixel position relative to origin (minYear)
	function yearToPx(fracYear: number): number {
		return (fracYear - minYear) * pxPerYear + panX;
	}

	// Convert pixel position to year
	function pxToYear(px: number): number {
		return (px - panX) / pxPerYear + minYear;
	}

	// Calculate lanes for events to avoid overlapping
	interface LaneEvent extends TimelineEventData {
		leftPx: number;
		widthPx: number;
		lane: number;
		startFrac: number;
		endFrac: number;
	}

	let laneEvents = $derived.by(() => {
		const sorted = [...eventCoordinates].sort((a, b) => a.startFrac - b.startFrac);
		const lanes: number[] = []; // stores rightmost edge for each lane
		const positioned: LaneEvent[] = [];

		for (const item of sorted) {
			const left = (item.startFrac - minYear) * pxPerYear;
			const duration = item.event.isSpan ? Math.max(0.3, item.endFrac - item.startFrac) : 0.4;
			const width = Math.max(160, duration * pxPerYear);

			// Find available lane
			let assignedLane = 0;
			let placed = false;
			for (let i = 0; i < lanes.length; i++) {
				if (left >= lanes[i] + 16) {
					assignedLane = i;
					lanes[i] = left + width;
					placed = true;
					break;
				}
			}
			if (!placed) {
				assignedLane = lanes.length;
				lanes.push(left + width);
			}

			positioned.push({
				...item.event,
				leftPx: left,
				widthPx: width,
				lane: assignedLane,
				startFrac: item.startFrac,
				endFrac: item.endFrac
			});
		}

		return positioned;
	});

	// Spans / Epochs for background band rendering
	let epochSpans = $derived(events.filter((e) => e.isSpan && e.endYear));

	// Ruler ticks using multi-scale adaptive generator
	let rulerTicks = $derived.by(() => {
		if (!containerEl) return [];
		const startVisibleYear = pxToYear(-150);
		const endVisibleYear = pxToYear(containerWidth + 150);

		const generated = generateAdaptiveRulerTicks(startVisibleYear, endVisibleYear, pxPerYear);
		return generated.map((t) => ({
			...t,
			x: yearToPx(t.fractionalYear)
		}));
	});

	// Drag & Pan handlers
	function handleMouseDown(e: MouseEvent) {
		if ((e.target as HTMLElement).closest('.interactive-event-card')) return;
		isDragging = true;
		startDragX = e.clientX;
		startPanX = panX;
	}

	function handleMouseMove(e: MouseEvent) {
		if (onCursorMove) {
			onCursorMove(e.clientX, e.clientY);
		}
		if (!isDragging) return;
		const dx = e.clientX - startDragX;
		panX = startPanX + dx;
	}

	function handleMouseUp() {
		isDragging = false;
	}

	// Smooth mouse-wheel zoom centered on mouse
	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		const rect = containerEl?.getBoundingClientRect();
		if (!rect) return;

		const mouseX = e.clientX - rect.left;
		const yearUnderMouse = pxToYear(mouseX);

		const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
		const newZoom = Math.min(25, Math.max(0.02, zoomLevel * zoomFactor));

		const newPxPerYear = BASE_PX_PER_YEAR * newZoom;
		const newPanX = mouseX - (yearUnderMouse - minYear) * newPxPerYear;

		zoomLevel = newZoom;
		panX = newPanX;
	}

	onMount(() => {
		if (containerEl) {
			containerWidth = containerEl.clientWidth;
		}

		const handleResize = () => {
			if (containerEl) {
				containerWidth = containerEl.clientWidth;
			}
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	});
</script>

<div
	bind:this={containerEl}
	onmousedown={handleMouseDown}
	onmousemove={handleMouseMove}
	onmouseup={handleMouseUp}
	onmouseleave={handleMouseUp}
	onwheel={handleWheel}
	class="relative flex-1 w-full h-full overflow-hidden bg-slate-950 select-none cursor-grab active:cursor-grabbing"
	role="region"
	aria-label="Horizontal Band Timeline"
>
	<!-- Background Epoch Spans -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		{#each epochSpans as span (span.id)}
			{@const startFrac = dateToFractionalYear(span.startYear, span.startDate)}
			{@const endFrac = dateToFractionalYear(span.endYear || span.startYear + 1, span.endDate)}
			{@const startX = yearToPx(startFrac)}
			{@const endX = yearToPx(endFrac)}
			{@const width = Math.max(10, endX - startX)}
			{@const stickyLeft = Math.max(0, Math.min(width - 150, -startX + 16))}

			{#if startX + width > 0 && startX < containerWidth}
				<div
					class="absolute top-0 bottom-0 border-x border-dashed transition-all opacity-20"
					style="left: {startX}px; width: {width}px; background-color: {span.color || '#6366f1'}; border-color: {span.color || '#6366f1'};"
				>
					{#if span.bgPattern === 'stripes'}
						<div
							class="w-full h-full opacity-40"
							style="background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);"
						></div>
					{/if}
				</div>

				<!-- Mitlaufende Sticky-Badges an Epochen-Grenzen beim horizontalen Scrollen -->
				<div
					class="absolute top-16 pointer-events-auto transition-transform"
					style="left: {startX + stickyLeft}px; z-index: 10;"
				>
					<div
						class="px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1.5 border border-white/20 backdrop-blur-md"
						style="background-color: {span.color || '#6366f1'};"
					>
						<Sparkles class="w-3 h-3" />
						<span>{span.title}</span>
						<span class="text-[10px] opacity-80">
							({formatEventDisplayDate(span.startYear, span.startDate)} – {formatEventDisplayDate(span.endYear || span.startYear, span.endDate)})
						</span>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Time Ruler (Sticky at Top) -->
	<div class="absolute top-0 left-0 right-0 h-14 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md z-20 pointer-events-none">
		{#each rulerTicks as tick}
			{#if tick.x >= -100 && tick.x <= containerWidth + 100}
				<div
					class="absolute top-0 bottom-0 flex flex-col items-center justify-end pb-1"
					style="left: {tick.x}px;"
				>
					<span class="text-[11px] font-mono font-medium text-slate-400 mb-1">
						{tick.label}
					</span>
					<div class="w-[1px] h-3 {tick.isMajor ? 'bg-slate-600' : 'bg-slate-800'}"></div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Events Container (Scrollable/Pannable Track Area) -->
	<div class="absolute inset-0 pt-28 pb-12 pointer-events-none">
		{#each laneEvents as evt (evt.id)}
			{@const x = yearToPx(evt.startFrac)}
			{@const top = 120 + evt.lane * 96}

			{#if x + evt.widthPx >= -200 && x <= containerWidth + 200}
				<div
					class="interactive-event-card absolute pointer-events-auto transition-transform hover:scale-[1.02] cursor-pointer"
					style="left: {x}px; top: {top}px; width: {evt.isSpan ? Math.max(180, evt.widthPx) : 220}px;"
					onclick={() => onSelectEvent(evt)}
					role="button"
					tabindex="0"
					onkeydown={(e) => e.key === 'Enter' && onSelectEvent(evt)}
				>
					<!-- Connection line to timeline -->
					<div class="absolute -top-3 left-6 w-[2px] h-3 bg-slate-700"></div>
					<div
						class="w-3 h-3 rounded-full absolute -top-4 left-[21px] border-2 border-slate-950"
						style="background-color: {evt.color || '#6366f1'};"
					></div>

					<!-- Card Body -->
					<div
						class="bg-slate-900/95 border border-slate-800 hover:border-slate-600 rounded-2xl p-3 shadow-xl backdrop-blur-md transition-all group"
						style="border-left: 4px solid {evt.color || '#6366f1'};"
					>
						<div class="flex items-center justify-between gap-2 mb-1">
							<span class="text-[11px] font-mono font-semibold text-indigo-400">
								{formatEventDisplayDate(evt.startYear, evt.startDate)}
								{#if evt.isSpan && evt.endYear}
									– {formatEventDisplayDate(evt.endYear, evt.endDate)}
								{/if}
							</span>
							{#if evt.isSpan}
								<span class="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
									Span
								</span>
							{/if}
						</div>

						<h4 class="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
							{evt.title}
						</h4>

						{#if evt.description}
							<p class="text-[11px] text-slate-400 mt-1 line-clamp-2">
								{evt.description}
							</p>
						{/if}

						{#if evt.tags && evt.tags.length > 0}
							<div class="flex items-center gap-1 mt-2 flex-wrap">
								{#each evt.tags.slice(0, 2) as tag}
									<span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400">
										#{tag}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>
</div>
