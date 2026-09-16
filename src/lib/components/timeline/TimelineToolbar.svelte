<script lang="ts">
	import {
		ZoomIn,
		ZoomOut,
		Maximize2,
		Calendar,
		Search,
		Undo,
		Redo,
		Download,
		Plus,
		LayoutList,
		Kanban,
		SlidersHorizontal,
		Share2,
		Users
	} from 'lucide-svelte';
	import type { CollabUser } from '$lib/stores/timeline-collab.svelte';

	let {
		viewMode = $bindable('horizontal'),
		zoomLevel = $bindable(1),
		searchTerm = $bindable(''),
		connectedUsers = [],
		canUndo = false,
		canRedo = false,
		onAutoFit,
		onGoToToday,
		onGoToYear,
		onUndo,
		onRedo,
		onAddEvent,
		onExportJson,
		onExportCsv
	}: {
		viewMode: 'horizontal' | 'vertical' | 'gantt';
		zoomLevel: number;
		searchTerm: string;
		connectedUsers: CollabUser[];
		canUndo: boolean;
		canRedo: boolean;
		onAutoFit: () => void;
		onGoToToday: () => void;
		onGoToYear: (year: number) => void;
		onUndo: () => void;
		onRedo: () => void;
		onAddEvent: () => void;
		onExportJson: () => void;
		onExportCsv: () => void;
	} = $props();

	let showYearModal = $state(false);
	let targetYear = $state(2026);
	let showExportMenu = $state(false);

	function submitGoToYear(e: SubmitEvent) {
		e.preventDefault();
		onGoToYear(Number(targetYear));
		showYearModal = false;
	}
</script>

<div class="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 flex items-center justify-between gap-3 text-xs select-none z-20 sticky top-0">
	<!-- Left Section: View Selector & Add Event -->
	<div class="flex items-center gap-2">
		<button
			type="button"
			onclick={onAddEvent}
			class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
		>
			<Plus class="w-4 h-4" />
			<span>Add Event</span>
		</button>

		<div class="h-5 w-[1px] bg-slate-800 mx-1"></div>

		<!-- View Switcher -->
		<div class="flex items-center bg-slate-950/80 p-1 border border-slate-800 rounded-xl">
			<button
				type="button"
				onclick={() => (viewMode = 'horizontal')}
				class="px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all {viewMode === 'horizontal' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'}"
				title="Horizontal Band (Default)"
			>
				<SlidersHorizontal class="w-3.5 h-3.5" />
				<span class="hidden sm:inline">Band</span>
			</button>

			<button
				type="button"
				onclick={() => (viewMode = 'vertical')}
				class="px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all {viewMode === 'vertical' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'}"
				title="Vertical Story Feed"
			>
				<LayoutList class="w-3.5 h-3.5" />
				<span class="hidden sm:inline">Feed</span>
			</button>

			<button
				type="button"
				onclick={() => (viewMode = 'gantt')}
				class="px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all {viewMode === 'gantt' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'}"
				title="Gantt / Compact Grid"
			>
				<Kanban class="w-3.5 h-3.5" />
				<span class="hidden sm:inline">Gantt</span>
			</button>
		</div>
	</div>

	<!-- Center Section: Navigation, Search & Zoom Controls -->
	<div class="flex items-center gap-2">
		<!-- Search Filter -->
		<div class="relative hidden md:block w-44 lg:w-56">
			<Search class="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
			<input
				type="text"
				placeholder="Filter events..."
				bind:value={searchTerm}
				class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
			/>
		</div>

		<!-- Jump to Today & Date -->
		<div class="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
			<button
				type="button"
				onclick={onGoToToday}
				class="px-2.5 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
			>
				Today
			</button>
			<button
				type="button"
				onclick={() => (showYearModal = true)}
				class="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1"
				title="Go to Year / Date"
			>
				<Calendar class="w-3.5 h-3.5" />
			</button>
		</div>

		<!-- Zoom & Auto-Scale (for Horizontal & Gantt views) -->
		{#if viewMode !== 'vertical'}
			<div class="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
				<button
					type="button"
					onclick={() => (zoomLevel = Math.max(0.1, zoomLevel * 0.8))}
					class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
					title="Zoom Out"
				>
					<ZoomOut class="w-3.5 h-3.5" />
				</button>
				<button
					type="button"
					onclick={onAutoFit}
					class="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 font-medium"
					title="Reset to Auto-Scale"
				>
					<Maximize2 class="w-3 h-3" />
					<span class="hidden sm:inline text-[11px]">Auto-Scale</span>
				</button>
				<button
					type="button"
					onclick={() => (zoomLevel = Math.min(10, zoomLevel * 1.25))}
					class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
					title="Zoom In"
				>
					<ZoomIn class="w-3.5 h-3.5" />
				</button>
			</div>
		{/if}

		<!-- Global Undo / Redo -->
		<div class="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-0.5">
			<button
				type="button"
				onclick={onUndo}
				disabled={!canUndo}
				class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors"
				title="Undo (Ctrl+Z)"
			>
				<Undo class="w-3.5 h-3.5" />
			</button>
			<button
				type="button"
				onclick={onRedo}
				disabled={!canRedo}
				class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 rounded-lg transition-colors"
				title="Redo (Ctrl+Y)"
			>
				<Redo class="w-3.5 h-3.5" />
			</button>
		</div>
	</div>

	<!-- Right Section: Live Awareness Users & Export -->
	<div class="flex items-center gap-2">
		<!-- Connected Collab Users Pills -->
		{#if connectedUsers.length > 0}
			<div class="flex items-center -space-x-1.5">
				{#each connectedUsers as user}
					<div
						class="w-6 h-6 rounded-full border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
						style="background-color: {user.color};"
						title="{user.name} is viewing/editing"
					>
						{user.name.slice(0, 1).toUpperCase()}
					</div>
				{/each}
			</div>
		{/if}

		<!-- Export Dropdown -->
		<div class="relative">
			<button
				type="button"
				onclick={() => (showExportMenu = !showExportMenu)}
				class="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-1.5 transition-all"
				title="Export Timeline"
			>
				<Download class="w-3.5 h-3.5" />
				<span class="hidden md:inline">Export</span>
			</button>

			{#if showExportMenu}
				<div class="absolute right-0 mt-1.5 w-40 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 z-30 animate-in fade-in">
					<button
						type="button"
						onclick={() => {
							onExportJson();
							showExportMenu = false;
						}}
						class="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between"
					>
						<span>Export JSON</span>
						<span class="text-[10px] text-slate-500">.json</span>
					</button>
					<button
						type="button"
						onclick={() => {
							onExportCsv();
							showExportMenu = false;
						}}
						class="w-full px-3 py-1.5 text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-between"
					>
						<span>Export CSV</span>
						<span class="text-[10px] text-slate-500">.csv</span>
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Jump to Year Modal -->
{#if showYearModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
		<div class="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl">
			<h4 class="text-sm font-bold text-white mb-3">Go to Year</h4>
			<form onsubmit={submitGoToYear} class="space-y-3">
				<div>
					<label for="target-year" class="block text-xs text-slate-400 mb-1">Enter Year (negative for BCE):</label>
					<input
						type="number"
						id="target-year"
						bind:value={targetYear}
						required
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
					/>
				</div>
				<div class="flex items-center justify-end gap-2 pt-2">
					<button
						type="button"
						onclick={() => (showYearModal = false)}
						class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium"
					>
						Jump
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
