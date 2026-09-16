<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { enhance } from '$app/forms';
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
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { exportTimelineJson, exportTimelineCsv, dateToFractionalYear } from '$lib/utils/timeline-time';
	import {
		ArrowLeft,
		Share2,
		Check,
		Lock,
		Globe,
		Settings,
		Users,
		UserPlus,
		Trash2,
		Copy,
		Code,
		X,
		AlertTriangle,
		Save
	} from 'lucide-svelte';

	let { data, form } = $props();

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

	// Modals
	let showShareModal = $state(false);
	let showSettingsModal = $state(false);
	let copiedLink = $state(false);
	let copiedEmbed = $state(false);
	let isSubmitting = $state(false);
	let confirmDelete = $state(false);

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

		const minYear = Math.min(...evts.map((e) => dateToFractionalYear(e.startYear, e.startDate)));
		const maxYear = Math.max(
			...evts.map((e) =>
				e.isSpan && e.endYear ? dateToFractionalYear(e.endYear, e.endDate) : dateToFractionalYear(e.startYear, e.startDate)
			)
		);
		const spanYears = Math.max(2, maxYear - minYear + 4);

		const availableWidth = window.innerWidth - 64;
		const targetPxPerYear = availableWidth / spanYears;

		// Calculate zoom level relative to BASE_PX_PER_YEAR (40px)
		zoomLevel = Math.max(0.05, Math.min(15, targetPxPerYear / 40));
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

	function copyEmbedCode() {
		const embedCode = `<iframe src="${window.location.origin}/embed/${data.timeline.id}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`;
		navigator.clipboard.writeText(embedCode);
		copiedEmbed = true;
		setTimeout(() => (copiedEmbed = false), 2000);
	}
</script>

<svelte:head>
	<title>{data.timeline.title} — EpochForge</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors duration-150">
	<!-- Top Navigation Header -->
	<header class="h-12 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between z-30 transition-colors">
		<div class="flex items-center gap-3">
			<a
				href="/"
				class="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
				title="Back to Dashboard"
			>
				<ArrowLeft class="w-4 h-4" />
			</a>
			<div>
				<h1 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
					<span>{data.timeline.title}</span>
					{#if data.timeline.isPublic}
						<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
							<Globe class="w-2.5 h-2.5" /> Public
						</span>
					{:else}
						<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-medium">
							<Lock class="w-2.5 h-2.5" /> Private
						</span>
					{/if}
				</h1>
			</div>
		</div>

		<div class="flex items-center gap-2.5">
			<!-- Role Badge -->
			<span class="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
				Role: <strong class="text-indigo-600 dark:text-indigo-400 capitalize">{data.userRole}</strong>
			</span>

			<!-- Share & Collaboration Modal Button -->
			<button
				type="button"
				onclick={() => (showShareModal = true)}
				class="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs flex items-center gap-1.5 transition-all"
			>
				<Share2 class="w-3.5 h-3.5" />
				<span>Share</span>
				{#if data.collaborators.length > 0}
					<span class="ml-0.5 px-1.5 py-0.2 bg-indigo-600 text-white rounded-full text-[10px]">
						{data.collaborators.length}
					</span>
				{/if}
			</button>

			<!-- Timeline Settings Button (Owner Only) -->
			{#if data.userRole === 'owner'}
				<button
					type="button"
					onclick={() => (showSettingsModal = true)}
					class="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
					title="Timeline Settings"
				>
					<Settings class="w-4 h-4" />
				</button>
			{/if}

			<!-- Light / Dark Theme Toggle -->
			<ThemeToggle />
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

	<!-- Share & Collaborator Management Modal -->
	{#if showShareModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
			<div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
							<Share2 class="w-4 h-4" />
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white">Share & Collaboration</h3>
					</div>
					<button
						type="button"
						onclick={() => (showShareModal = false)}
						class="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<!-- Visibility Toggle Card -->
				<div class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-lg {data.timeline.isPublic ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'} flex items-center justify-center">
							{#if data.timeline.isPublic}
								<Globe class="w-4 h-4" />
							{:else}
								<Lock class="w-4 h-4" />
							{/if}
						</div>
						<div>
							<div class="text-sm font-semibold text-slate-900 dark:text-white">
								{data.timeline.isPublic ? 'Public Timeline' : 'Private Timeline'}
							</div>
							<div class="text-xs text-slate-500 dark:text-slate-400">
								{data.timeline.isPublic ? 'Anyone with the link can view' : 'Only invited members can view'}
							</div>
						</div>
					</div>

					{#if data.userRole === 'owner'}
						<form action="?/togglePublic" method="POST" use:enhance>
							<button
								type="submit"
								class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all {data.timeline.isPublic ? 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300' : 'bg-emerald-600 text-white hover:bg-emerald-500'}"
							>
								{data.timeline.isPublic ? 'Make Private' : 'Make Public'}
							</button>
						</form>
					{/if}
				</div>

				<!-- Copy Link & Embed Options -->
				<div class="space-y-3">
					<div>
						<label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Live Share Link</label>
						<div class="flex items-center gap-2">
							<input
								type="text"
								readonly
								value={typeof window !== 'undefined' ? window.location.href : ''}
								class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 select-all font-mono"
							/>
							<button
								type="button"
								onclick={copyShareLink}
								class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
							>
								{#if copiedLink}
									<Check class="w-3.5 h-3.5" />
									<span>Copied!</span>
								{:else}
									<Copy class="w-3.5 h-3.5" />
									<span>Copy</span>
								{/if}
							</button>
						</div>
					</div>

					<div>
						<label class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Embed iFrame</label>
						<div class="flex items-center gap-2">
							<input
								type="text"
								readonly
								value={`<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}/embed/${data.timeline.id}" width="100%" height="600" frameborder="0"></iframe>`}
								class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-300 select-all font-mono"
							/>
							<button
								type="button"
								onclick={copyEmbedCode}
								class="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
							>
								{#if copiedEmbed}
									<Check class="w-3.5 h-3.5" />
									<span>Copied!</span>
								{:else}
									<Code class="w-3.5 h-3.5" />
									<span>Copy</span>
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Collaborators Management -->
				<div class="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
					<div class="flex items-center justify-between">
						<h4 class="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Team Collaborators</h4>
						<span class="text-xs text-slate-400">{1 + data.collaborators.length} members</span>
					</div>

					<!-- Invite Form (Owner Only) -->
					{#if data.userRole === 'owner'}
						<form
							action="?/addCollaborator"
							method="POST"
							use:enhance
							class="flex flex-col sm:flex-row gap-2"
						>
							<input
								type="email"
								name="email"
								required
								placeholder="colleague@example.com"
								class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
							/>
							<select
								name="role"
								class="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
							>
								<option value="editor">Editor (Can edit)</option>
								<option value="viewer">Viewer (Read only)</option>
							</select>
							<button
								type="submit"
								class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
							>
								<UserPlus class="w-3.5 h-3.5" />
								<span>Invite</span>
							</button>
						</form>
					{/if}

					<!-- Members List -->
					<div class="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
						<!-- Owner -->
						<div class="p-3 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between">
							<div class="flex items-center gap-2.5">
								<div class="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
									{data.owner?.name?.[0]?.toUpperCase() || 'O'}
								</div>
								<div>
									<div class="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
										<span>{data.owner?.name || 'Timeline Owner'}</span>
										<span class="text-[9px] px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded font-bold uppercase">Owner</span>
									</div>
									<div class="text-[11px] text-slate-500">{data.owner?.email}</div>
								</div>
							</div>
						</div>

						<!-- Collaborators -->
						{#each data.collaborators as collab}
							<div class="p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
								<div class="flex items-center gap-2.5">
									<div class="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center">
										{collab.name[0]?.toUpperCase()}
									</div>
									<div>
										<div class="text-xs font-semibold text-slate-900 dark:text-white">{collab.name}</div>
										<div class="text-[11px] text-slate-500">{collab.email}</div>
									</div>
								</div>

								<div class="flex items-center gap-2">
									{#if data.userRole === 'owner'}
										<form action="?/updateCollaboratorRole" method="POST" use:enhance>
											<input type="hidden" name="collab_id" value={collab.id} />
											<select
												name="role"
												value={collab.role}
												onchange={(e) => (e.currentTarget.form?.requestSubmit())}
												class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-700 dark:text-slate-300"
											>
												<option value="editor">Editor</option>
												<option value="viewer">Viewer</option>
											</select>
										</form>

										<form action="?/removeCollaborator" method="POST" use:enhance>
											<input type="hidden" name="collab_id" value={collab.id} />
											<button
												type="submit"
												class="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
												title="Remove collaborator"
											>
												<Trash2 class="w-3.5 h-3.5" />
											</button>
										</form>
									{:else}
										<span class="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
											{collab.role}
										</span>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Timeline Settings Modal (Owner Only) -->
	{#if showSettingsModal && data.userRole === 'owner'}
		<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
			<div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
				<div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
					<div class="flex items-center gap-2.5">
						<div class="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
							<Settings class="w-4 h-4" />
						</div>
						<h3 class="text-base font-bold text-slate-900 dark:text-white">Timeline Settings</h3>
					</div>
					<button
						type="button"
						onclick={() => (showSettingsModal = false)}
						class="text-slate-400 hover:text-slate-600 dark:hover:text-white"
					>
						<X class="w-5 h-5" />
					</button>
				</div>

				<form
					action="?/updateTimeline"
					method="POST"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ update }) => {
							isSubmitting = false;
							showSettingsModal = false;
							await update();
						};
					}}
					class="space-y-4"
				>
					<div>
						<label for="timeline-title" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title</label>
						<input
							type="text"
							id="timeline-title"
							name="title"
							required
							value={data.timeline.title}
							class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
						/>
					</div>

					<div>
						<label for="timeline-description" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
						<textarea
							id="timeline-description"
							name="description"
							rows="3"
							value={data.timeline.description || ''}
							placeholder="Provide context or a brief overview for this timeline..."
							class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
						></textarea>
					</div>

					<div>
						<label for="default-view" class="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Default View Mode</label>
						<select
							id="default-view"
							name="default_view"
							value={data.timeline.defaultView}
							class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
						>
							<option value="horizontal">Horizontal Band View (Default)</option>
							<option value="vertical">Vertical Story Feed</option>
							<option value="gantt">Gantt / Compact Grid</option>
						</select>
					</div>

					<div class="pt-2 flex justify-end">
						<button
							type="submit"
							disabled={isSubmitting}
							class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-xs flex items-center gap-2 shadow-sm transition-all"
						>
							<Save class="w-3.5 h-3.5" />
							<span>{isSubmitting ? 'Saving...' : 'Save Settings'}</span>
						</button>
					</div>
				</form>

				<!-- Danger Zone: Delete Timeline -->
				<div class="pt-5 border-t border-rose-200 dark:border-rose-950/60">
					<div class="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-semibold text-xs mb-2">
						<AlertTriangle class="w-4 h-4" />
						<span>Danger Zone</span>
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 mb-3">
						Permanently delete this timeline, all events, and all collaboration history. This action cannot be undone.
					</p>

					{#if !confirmDelete}
						<button
							type="button"
							onclick={() => (confirmDelete = true)}
							class="px-4 py-2 border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-medium transition-all"
						>
							Delete Timeline...
						</button>
					{:else}
						<div class="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl space-y-3">
							<p class="text-xs font-semibold text-rose-800 dark:text-rose-300">Are you absolutely sure?</p>
							<div class="flex items-center gap-2">
								<form action="?/deleteTimeline" method="POST">
									<button
										type="submit"
										class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-medium rounded-lg text-xs transition-all"
									>
										Yes, Delete Permanently
									</button>
								</form>
								<button
									type="button"
									onclick={() => (confirmDelete = false)}
									class="px-3.5 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs transition-all"
								>
									Cancel
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
