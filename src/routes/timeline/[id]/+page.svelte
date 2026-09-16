<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		TimelineCollabClient,
		type TimelineEventData
	} from '$lib/stores/timeline-collab.svelte';
	import TimelineToolbar from '$lib/components/timeline/TimelineToolbar.svelte';
	import HorizontalBandView from '$lib/components/timeline/HorizontalBandView.svelte';
	import VerticalStoryFeedView from '$lib/components/timeline/VerticalStoryFeedView.svelte';
	import GanttGridView from '$lib/components/timeline/GanttGridView.svelte';
	import EventDialog from '$lib/components/timeline/EventDialog.svelte';
	import LiveCursors from '$lib/components/timeline/LiveCursors.svelte';
	import { exportTimelineJson, exportTimelineCsv } from '$lib/utils/timeline-time';
	import { ArrowLeft, Share2, Check, Lock, Globe } from 'lucide-svelte';

	let { data } = $props();

	// Local state
	let collabClient: TimelineCollabClient | null = $state(null);
	let viewMode = $state<'horizontal' | 'vertical' | 'gantt'>('horizontal');
	$effect(() => {
		if (data.timeline.defaultView) {
			viewMode = data.timeline.defaultView as any;
		}
	});
	let zoomLevel = $state(1);
	let panX = $state(0);
	let searchTerm = $state('');

	// Dialog state
	let isDialogOpen = $state(false);
	let editingEvent = $state<TimelineEventData | null>(null);

	// Share popover
	let showShare = $state(false);
	let copiedLink = $state(false);

	// Initialize Yjs + Hocuspocus Client
	onMount(() => {
		collabClient = new TimelineCollabClient(data.timeline.id, data.currentUser);

		// If Ydoc is brand new and empty, seed it with SSR initialEvents
		if (collabClient.events.length === 0 && data.initialEvents.length > 0) {
			for (const evt of data.initialEvents) {
				collabClient.addEvent({
					id: evt.id,
					title: evt.title,
					description: evt.description || '',
					startYear: evt.startYear,
					startDate: evt.startDate,
					endYear: evt.endYear,
					endDate: evt.endDate,
					isSpan: evt.isSpan,
					color: evt.color || '#6366f1',
					bgImageUrl: evt.bgImageUrl || '',
					bgPattern: evt.bgPattern || '',
					badgeIcon: evt.badgeIcon || '',
					tags: (evt.tags as string[]) || []
				});
			}
		}

		// Initial Auto-Scale
		setTimeout(() => {
			autoFitTimeline();
		}, 100);

		// Global Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
				return;
			}
			if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
				if (e.shiftKey) {
					collabClient?.redo();
				} else {
					collabClient?.undo();
				}
				e.preventDefault();
			} else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
				collabClient?.redo();
				e.preventDefault();
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	});

	onDestroy(() => {
		collabClient?.destroy();
	});

	// Filtered events
	let activeEvents = $derived.by(() => {
		const source = collabClient ? collabClient.events : data.initialEvents;
		if (!searchTerm.trim()) return source;
		const q = searchTerm.toLowerCase();
		return source.filter(
			(e) =>
				e.title.toLowerCase().includes(q) ||
				e.description?.toLowerCase().includes(q) ||
				e.tags?.some((t) => t.toLowerCase().includes(q))
		);
	});

	// Auto-Scale Algorithm
	function autoFitTimeline() {
		const evts = collabClient?.events || data.initialEvents;
		if (evts.length === 0) return;

		const minYear = Math.min(...evts.map((e) => e.startYear));
		const maxYear = Math.max(...evts.map((e) => (e.isSpan && e.endYear ? e.endYear : e.startYear)));
		const spanYears = Math.max(2, maxYear - minYear + 4);

		const availableWidth = window.innerWidth - 64;
		const targetPxPerYear = availableWidth / spanYears;

		// Calculate zoom level relative to BASE_PX_PER_YEAR (40px)
		zoomLevel = Math.max(0.1, Math.min(10, targetPxPerYear / 40));
		panX = 32;
	}

	function goToToday() {
		const currentYear = new Date().getFullYear();
		goToYear(currentYear);
	}

	function goToYear(targetYear: number) {
		const evts = collabClient?.events || data.initialEvents;
		const minYear = evts.length > 0 ? Math.min(...evts.map((e) => e.startYear)) - 5 : 2000;
		const pxPerYear = 40 * zoomLevel;
		const targetPx = (targetYear - minYear) * pxPerYear;
		panX = window.innerWidth / 2 - targetPx;
	}

	function handleAddEvent() {
		editingEvent = null;
		isDialogOpen = true;
	}

	function handleSelectEvent(event: TimelineEventData) {
		editingEvent = event;
		isDialogOpen = true;
		collabClient?.setActiveEvent(event.id);
	}

	function handleSaveEvent(saved: TimelineEventData) {
		if (editingEvent) {
			collabClient?.updateEvent(saved.id, saved);
		} else {
			collabClient?.addEvent(saved);
		}
		collabClient?.setActiveEvent(null);
	}

	function handleDeleteEvent(id: string) {
		collabClient?.deleteEvent(id);
		collabClient?.setActiveEvent(null);
	}

	function handleExportJson() {
		const jsonStr = exportTimelineJson(collabClient?.events || data.initialEvents, data.timeline.title);
		downloadFile(jsonStr, `${data.timeline.title || 'timeline'}.json`, 'application/json');
	}

	function handleExportCsv() {
		const csvStr = exportTimelineCsv(collabClient?.events || data.initialEvents);
		downloadFile(csvStr, `${data.timeline.title || 'timeline'}.csv`, 'text/csv');
	}

	function downloadFile(content: string, filename: string, mime: string) {
		const blob = new Blob([content], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	function copyShareLink() {
		navigator.clipboard.writeText(window.location.href);
		copiedLink = true;
		setTimeout(() => (copiedLink = false), 2000);
	}
</script>

<svelte:head>
	<title>{data.timeline.title} — EpochForge</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
	<!-- Top Navigation Header -->
	<header class="h-12 border-b border-slate-800 bg-slate-900/90 px-4 flex items-center justify-between z-30">
		<div class="flex items-center gap-3">
			<a
				href="/"
				class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
				title="Back to Dashboard"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<h1 class="text-sm font-bold text-white flex items-center gap-2">
					<span>{data.timeline.title}</span>
					{#if data.timeline.isPublic}
						<span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-normal">
							<Globe class="w-2.5 h-2.5" /> Public
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-normal">
							<Lock class="w-2.5 h-2.5" /> Private
						</span>
					{/if}
				</h1>
			</div>
		</div>

		<div class="flex items-center gap-3">
			<!-- Role Badge -->
			<span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
				Role: <strong class="text-indigo-400 capitalize">{data.userRole}</strong>
			</span>

			<!-- Share / Embed Popover -->
			<div class="relative">
				<button
					type="button"
					onclick={() => (showShare = !showShare)}
					class="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-all"
				>
					<Share2 class="w-3.5 h-3.5" />
					<span>Share</span>
				</button>

				{#if showShare}
					<div class="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-40 animate-in fade-in">
						<div class="text-xs font-bold text-white mb-2">Share & Embed</div>
						<div class="space-y-2">
							<button
								type="button"
								onclick={copyShareLink}
								class="w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center justify-between transition-colors"
							>
								<span>Copy Live Link</span>
								{#if copiedLink}
									<Check class="w-3.5 h-3.5 text-emerald-400" />
								{/if}
							</button>

							<div>
								<div class="text-[10px] text-slate-400 mb-1">iFrame Embed Code:</div>
								<textarea
									readonly
									rows="2"
									class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] font-mono text-slate-300 select-all resize-none"
									value={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${data.timeline.id}" width="100%" height="600" frameborder="0"></iframe>`}
								></textarea>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Interactive Toolbar -->
	<TimelineToolbar
		bind:viewMode
		bind:zoomLevel
		bind:searchTerm
		connectedUsers={collabClient?.connectedUsers || []}
		canUndo={collabClient?.canUndo || false}
		canRedo={collabClient?.canRedo || false}
		onAutoFit={autoFitTimeline}
		onGoToToday={goToToday}
		onGoToYear={goToYear}
		onUndo={() => collabClient?.undo()}
		onRedo={() => collabClient?.redo()}
		onAddEvent={handleAddEvent}
		onExportJson={handleExportJson}
		onExportCsv={handleExportCsv}
	/>

	<!-- Active Viewport -->
	<main class="flex-1 w-full h-full relative overflow-hidden flex flex-col">
		<!-- Live Collaborative Cursors -->
		<LiveCursors users={collabClient?.connectedUsers || []} />

		{#if viewMode === 'horizontal'}
			<HorizontalBandView
				events={activeEvents}
				bind:zoomLevel
				bind:panX
				onSelectEvent={handleSelectEvent}
				onCursorMove={(x, y) => collabClient?.setCursor(x, y)}
			/>
		{:else if viewMode === 'vertical'}
			<VerticalStoryFeedView
				events={activeEvents}
				onSelectEvent={handleSelectEvent}
			/>
		{:else if viewMode === 'gantt'}
			<GanttGridView
				events={activeEvents}
				{zoomLevel}
				onSelectEvent={handleSelectEvent}
			/>
		{/if}
	</main>

	<!-- Event Creation / Editing Modal Dialog -->
	<EventDialog
		bind:isOpen={isDialogOpen}
		initialEvent={editingEvent}
		onSave={handleSaveEvent}
		onDelete={handleDeleteEvent}
	/>
</div>
