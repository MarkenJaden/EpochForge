<script lang="ts">
	import { X, Calendar, Image, Palette, Tag, Trash2, Check } from 'lucide-svelte';
	import type { TimelineEventData } from '$lib/stores/timeline-collab.svelte';

	let {
		isOpen = $bindable(false),
		initialEvent = null as TimelineEventData | null,
		onSave,
		onDelete
	}: {
		isOpen: boolean;
		initialEvent: TimelineEventData | null;
		onSave: (event: TimelineEventData) => void;
		onDelete?: (id: string) => void;
	} = $props();

	let id = $state('');
	let title = $state('');
	let description = $state('');
	let isSpan = $state(false);
	let startYear = $state(2026);
	let startDate = $state('');
	let endYear = $state<number | null>(null);
	let endDate = $state<string | null>(null);
	let color = $state('#6366f1');
	let bgImageUrl = $state('');
	let bgPattern = $state('none');
	let tagsInput = $state('');

	const PRESET_COLORS = [
		'#6366f1', // Indigo
		'#3b82f6', // Blue
		'#06b6d4', // Cyan
		'#10b981', // Emerald
		'#eab308', // Yellow
		'#f97316', // Orange
		'#ef4444', // Red
		'#ec4899', // Pink
		'#8b5cf6'  // Violet
	];

	const PATTERNS = [
		{ id: 'none', label: 'Solid' },
		{ id: 'stripes', label: 'Diagonal Stripes' },
		{ id: 'dots', label: 'Polka Dots' },
		{ id: 'grid', label: 'Subtle Grid' }
	];

	$effect(() => {
		if (isOpen) {
			if (initialEvent) {
				id = initialEvent.id;
				title = initialEvent.title;
				description = initialEvent.description || '';
				isSpan = initialEvent.isSpan;
				startYear = initialEvent.startYear;
				startDate = initialEvent.startDate || '';
				endYear = initialEvent.endYear ?? null;
				endDate = initialEvent.endDate ?? null;
				color = initialEvent.color || '#6366f1';
				bgImageUrl = initialEvent.bgImageUrl || '';
				bgPattern = initialEvent.bgPattern || 'none';
				tagsInput = (initialEvent.tags || []).join(', ');
			} else {
				id = crypto.randomUUID();
				title = '';
				description = '';
				isSpan = false;
				startYear = new Date().getFullYear();
				startDate = '';
				endYear = null;
				endDate = null;
				color = '#6366f1';
				bgImageUrl = '';
				bgPattern = 'none';
				tagsInput = '';
			}
		}
	});

	function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		const tags = tagsInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);

		onSave({
			id,
			title: title.trim() || 'Untitled Event',
			description: description.trim(),
			isSpan,
			startYear: Number(startYear),
			startDate: startDate && startDate.trim() ? startDate.trim() : null,
			endYear: isSpan ? (endYear !== null ? Number(endYear) : Number(startYear) + 1) : null,
			endDate: isSpan && endDate && endDate.trim() ? endDate.trim() : null,
			color,
			bgImageUrl,
			bgPattern: bgPattern === 'none' ? undefined : bgPattern,
			tags
		});

		isOpen = false;
	}

	function handleDelete() {
		if (initialEvent && onDelete) {
			onDelete(initialEvent.id);
			isOpen = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
		<div class="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
				<h3 class="text-lg font-bold text-white">
					{initialEvent ? 'Edit Event / Epoch' : 'New Event / Epoch'}
				</h3>
				<button
					type="button"
					onclick={() => (isOpen = false)}
					class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Title -->
				<div>
					<label for="event-title" class="block text-xs font-semibold text-slate-300 mb-1">Title</label>
					<input
						type="text"
						id="event-title"
						bind:value={title}
						required
						placeholder="e.g. Apollo 11 Moon Landing or Bronze Age"
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<!-- Single vs Span Switch -->
				<div class="flex items-center gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
					<span class="text-xs font-medium text-slate-300">Event Type:</span>
					<button
						type="button"
						onclick={() => (isSpan = false)}
						class="px-3 py-1 rounded-lg text-xs font-medium transition-all {!isSpan ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
					>
						Point in Time
					</button>
					<button
						type="button"
						onclick={() => (isSpan = true)}
						class="px-3 py-1 rounded-lg text-xs font-medium transition-all {isSpan ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}"
					>
						Span / Epoch
					</button>
				</div>

				<!-- Dates & Years -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="start-year" class="block text-xs font-semibold text-slate-300 mb-1">
							Start Year <span class="text-slate-500 font-normal">(negative for BCE)</span>
						</label>
						<input
							type="number"
							id="start-year"
							bind:value={startYear}
							required
							placeholder="e.g. 1969 or -500"
							class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
						/>
					</div>

					<div>
						<label for="start-date" class="block text-xs font-semibold text-slate-300 mb-1">Specific Date <span class="text-slate-500 font-normal">(Optional)</span></label>
						<input
							type="date"
							id="start-date"
							bind:value={startDate}
							onchange={() => {
								if (startDate) {
									const y = parseInt(startDate.slice(0, 4), 10);
									if (!isNaN(y)) startYear = y;
								}
							}}
							class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
						/>
					</div>
				</div>

				{#if isSpan}
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
						<div>
							<label for="end-year" class="block text-xs font-semibold text-slate-300 mb-1">
								End Year <span class="text-slate-500 font-normal">(negative for BCE)</span>
							</label>
							<input
								type="number"
								id="end-year"
								bind:value={endYear}
								placeholder="e.g. 1972 or -300"
								class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
							/>
						</div>

						<div>
							<label for="end-date" class="block text-xs font-semibold text-slate-300 mb-1">End Date <span class="text-slate-500 font-normal">(Optional)</span></label>
							<input
								type="date"
								id="end-date"
								bind:value={endDate}
								onchange={() => {
									if (endDate) {
										const y = parseInt(endDate.slice(0, 4), 10);
										if (!isNaN(y)) endYear = y;
									}
								}}
								class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
					</div>
				{/if}

				<!-- Description -->
				<div>
					<label for="description" class="block text-xs font-semibold text-slate-300 mb-1">Description</label>
					<textarea
						id="description"
						bind:value={description}
						rows="3"
						placeholder="Add details, notes or summary..."
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
					></textarea>
				</div>

				<!-- Color Picker -->
				<div>
					<label class="block text-xs font-semibold text-slate-300 mb-1.5">Color Accent</label>
					<div class="flex items-center gap-2 flex-wrap">
						{#each PRESET_COLORS as c}
							<button
								type="button"
								onclick={() => (color = c)}
								class="w-7 h-7 rounded-lg transition-transform flex items-center justify-center {color === c ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'}"
								style="background-color: {c}"
							>
								{#if color === c}
									<Check class="w-4 h-4 text-white drop-shadow" />
								{/if}
							</button>
						{/each}
						<input
							type="color"
							bind:value={color}
							class="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
						/>
					</div>
				</div>

				<!-- Span Background Settings -->
				{#if isSpan}
					<div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
						<div class="text-xs font-semibold text-slate-300">Span Background Styling</div>
						<div class="grid grid-cols-2 gap-2">
							{#each PATTERNS as p}
								<button
									type="button"
									onclick={() => (bgPattern = p.id)}
									class="px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all {bgPattern === p.id ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300' : 'border-slate-800 text-slate-400 hover:text-white'}"
								>
									{p.label}
								</button>
							{/each}
						</div>

						<div>
							<label for="bg-image-url" class="block text-xs font-medium text-slate-400 mb-1">Background Image URL (Cover)</label>
							<input
								type="url"
								id="bg-image-url"
								bind:value={bgImageUrl}
								placeholder="https://example.com/epoch-cover.jpg"
								class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>
					</div>
				{/if}

				<!-- Tags -->
				<div>
					<label for="tags" class="block text-xs font-semibold text-slate-300 mb-1">Tags</label>
					<input
						type="text"
						id="tags"
						bind:value={tagsInput}
						placeholder="Space, History, Apollo (comma-separated)"
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center justify-between pt-4 border-t border-slate-800 mt-6">
					{#if initialEvent && onDelete}
						<button
							type="button"
							onclick={handleDelete}
							class="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/40 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all"
						>
							<Trash2 class="w-4 h-4" />
							<span>Delete</span>
						</button>
					{:else}
						<div></div>
					{/if}

					<div class="flex items-center gap-2">
						<button
							type="button"
							onclick={() => (isOpen = false)}
							class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition-all"
						>
							Cancel
						</button>
						<button
							type="submit"
							class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-lg shadow-indigo-600/30 transition-all"
						>
							{initialEvent ? 'Save Changes' : 'Create Event'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
{/if}
