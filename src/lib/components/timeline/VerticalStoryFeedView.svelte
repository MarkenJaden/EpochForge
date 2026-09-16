<script lang="ts">
	import type { TimelineEventData } from '$lib/stores/timeline-collab.svelte';
	import { formatYear } from '$lib/utils/timeline-time';
	import { Calendar, Tag, Sparkles } from 'lucide-svelte';

	let {
		events = [],
		onSelectEvent
	}: {
		events: TimelineEventData[];
		onSelectEvent: (event: TimelineEventData) => void;
	} = $props();

	// Sort events chronologically
	let sortedEvents = $derived(
		[...events].sort((a, b) => a.startYear - b.startYear)
	);
</script>

<div class="flex-1 w-full h-full overflow-y-auto bg-slate-950 p-6 md:p-12">
	<div class="max-w-3xl mx-auto relative">
		<!-- Vertical Central Line -->
		<div class="absolute left-6 md:left-1/2 top-4 bottom-4 w-0.5 bg-slate-800 -translate-x-1/2"></div>

		{#if sortedEvents.length === 0}
			<div class="text-center py-20 text-slate-500">
				No events match the current filter or timeline is empty.
			</div>
		{/if}

		<div class="space-y-10 relative">
			{#each sortedEvents as evt, idx (evt.id)}
				{@const isEven = idx % 2 === 0}

				<div class="relative flex flex-col md:flex-row items-start {isEven ? 'md:flex-row-reverse' : ''} gap-8">
					<!-- Timeline Center Node Indicator -->
					<div
						class="absolute left-6 md:left-1/2 top-5 -translate-x-1/2 w-5 h-5 rounded-full border-4 border-slate-950 shadow-md z-10 transition-transform hover:scale-125"
						style="background-color: {evt.color || '#6366f1'};"
					></div>

					<!-- Spacer on the opposite side for desktop alternation -->
					<div class="hidden md:block w-1/2"></div>

					<!-- Story Card Container -->
					<div class="w-full md:w-1/2 pl-12 md:pl-0 {isEven ? 'md:pr-10 md:text-right' : 'md:pl-10'}">
						<div
							onclick={() => onSelectEvent(evt)}
							onkeydown={(e) => e.key === 'Enter' && onSelectEvent(evt)}
							role="button"
							tabindex="0"
							class="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.01] cursor-pointer group text-left"
						>
							{#if evt.bgImageUrl}
								<img
									src={evt.bgImageUrl}
									alt={evt.title}
									class="w-full h-36 object-cover rounded-xl mb-3 border border-slate-800"
								/>
							{/if}

							<div class="flex items-center gap-2 mb-2 {isEven ? 'md:justify-end' : ''}">
								<span
									class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-white shadow"
									style="background-color: {evt.color || '#6366f1'};"
								>
									{formatYear(evt.startYear)}
									{#if evt.isSpan && evt.endYear}
										– {formatYear(evt.endYear)}
									{/if}
								</span>

								{#if evt.isSpan}
									<span class="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
										Epoch Span
									</span>
								{/if}
							</div>

							<h3 class="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
								{evt.title}
							</h3>

							{#if evt.description}
								<p class="text-xs text-slate-400 mt-2 leading-relaxed">
									{evt.description}
								</p>
							{/if}

							{#if evt.tags && evt.tags.length > 0}
								<div class="flex items-center gap-1.5 mt-3 flex-wrap">
									{#each evt.tags as tag}
										<span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
											#{tag}
										</span>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
