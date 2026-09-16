<script lang="ts">
	import { enhance } from '$app/forms';
	import { signOut } from '$lib/auth-client';
	import {
		Sparkles,
		Plus,
		Shield,
		LogOut,
		LogIn,
		Globe,
		Lock,
		Calendar,
		SlidersHorizontal,
		LayoutList,
		Kanban,
		ExternalLink,
		X
	} from 'lucide-svelte';

	let { data, form } = $props();

	let isCreateModalOpen = $state(false);
	let newTitle = $state('');
	let newDescription = $state('');
	let newIsPublic = $state(false);
	let newDefaultView = $state<'horizontal' | 'vertical' | 'gantt'>('horizontal');
	let creating = $state(false);

	async function handleSignOut() {
		await signOut();
		window.location.reload();
	}
</script>

<svelte:head>
	<title>EpochForge — Collaborative High-Performance Timelines</title>
</svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
	<!-- Navbar -->
	<header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
		<div class="flex items-center gap-3">
			<div class="inline-flex p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
				<Sparkles class="w-5 h-5" />
			</div>
			<span class="text-xl font-bold text-white tracking-tight">EpochForge</span>
		</div>

		<div class="flex items-center gap-3">
			{#if data.user}
				{#if data.user.role === 'superadmin'}
					<a
						href="/admin/settings"
						class="px-3 py-1.5 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-800 text-indigo-300 rounded-xl text-xs flex items-center gap-1.5 transition-all font-medium"
					>
						<Shield class="w-3.5 h-3.5" />
						<span>Admin Settings</span>
					</a>
				{/if}

				<div class="flex items-center gap-2 pl-2 border-l border-slate-800">
					<span class="text-xs text-slate-300 font-medium">{data.user.name}</span>
					<button
						type="button"
						onclick={handleSignOut}
						class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
						title="Sign Out"
					>
						<LogOut class="w-4 h-4" />
					</button>
				</div>
			{:else}
				<a
					href="/login"
					class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
				>
					<LogIn class="w-3.5 h-3.5" />
					<span>Sign In</span>
				</a>
			{/if}
		</div>
	</header>

	<!-- Main Workspace Dashboard -->
	<main class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-10">
		<!-- Hero Section -->
		<div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-purple-950/40 border border-slate-800 p-8 md:p-12 shadow-2xl">
			<div class="max-w-2xl">
				<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium mb-4">
					<Sparkles class="w-3.5 h-3.5" />
					<span>Next-Gen Animated Real-Time Timeline Engine</span>
				</div>
				<h1 class="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
					Craft, Explore & Collaborate on Living Epochs.
				</h1>
				<p class="text-sm md:text-base text-slate-400 mt-4 leading-relaxed">
					From deep astronomical antiquity (BCE) to modern project roadmaps. Powered by Svelte 5, Yjs CRDT real-time sync, and multi-view canvas visualization.
				</p>

				<div class="mt-8 flex items-center gap-3">
					{#if data.user}
						<button
							type="button"
							onclick={() => (isCreateModalOpen = true)}
							class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
						>
							<Plus class="w-4 h-4" />
							<span>Create Timeline</span>
						</button>
					{:else}
						<a
							href="/login"
							class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
						>
							<span>Get Started</span>
						</a>
					{/if}
				</div>
			</div>
		</div>

		<!-- My Timelines Section -->
		{#if data.user}
			<div class="space-y-4">
				<div class="flex items-center justify-between">
					<h2 class="text-lg font-bold text-white flex items-center gap-2">
						<span>My Timelines</span>
						<span class="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
							{data.myTimelines.length}
						</span>
					</h2>
					<button
						type="button"
						onclick={() => (isCreateModalOpen = true)}
						class="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
					>
						<Plus class="w-3.5 h-3.5" />
						<span>New Timeline</span>
					</button>
				</div>

				{#if data.myTimelines.length === 0}
					<div class="p-12 border border-dashed border-slate-800 rounded-2xl text-center space-y-3">
						<p class="text-sm text-slate-400">You haven't forged any timelines yet.</p>
						<button
							type="button"
							onclick={() => (isCreateModalOpen = true)}
							class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium inline-flex items-center gap-2 transition-all"
						>
							<Plus class="w-4 h-4" />
							<span>Create Your First Timeline</span>
						</button>
					</div>
				{:else}
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{#each data.myTimelines as tl}
							<a
								href="/timeline/{tl.id}"
								class="block p-5 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl shadow-lg transition-all group hover:-translate-y-1"
							>
								<div class="flex items-center justify-between gap-2 mb-3">
									<div class="flex items-center gap-1.5">
										{#if tl.defaultView === 'vertical'}
											<LayoutList class="w-4 h-4 text-indigo-400" />
										{:else if tl.defaultView === 'gantt'}
											<Kanban class="w-4 h-4 text-indigo-400" />
										{:else}
											<SlidersHorizontal class="w-4 h-4 text-indigo-400" />
										{/if}
										<span class="text-xs text-slate-400 capitalize">{tl.defaultView}</span>
									</div>

									{#if tl.isPublic}
										<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300 font-medium">
											<Globe class="w-2.5 h-2.5" /> Public
										</span>
									{:else}
										<span class="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
											<Lock class="w-2.5 h-2.5" /> Private
										</span>
									{/if}
								</div>

								<h3 class="font-bold text-white text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
									{tl.title}
								</h3>
								<p class="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
									{tl.description || 'No description provided.'}
								</p>

								<div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
									<span>Created {new Date(tl.createdAt).toLocaleDateString()}</span>
									<span class="text-indigo-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 font-medium">
										Open &rarr;
									</span>
								</div>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		{/if}

		<!-- Public Explorer Section -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<h2 class="text-lg font-bold text-white flex items-center gap-2">
					<Globe class="w-4 h-4 text-indigo-400" />
					<span>Explore Public Timelines</span>
				</h2>
			</div>

			{#if data.publicTimelines.length === 0}
				<div class="p-8 border border-slate-800/60 rounded-2xl text-center text-xs text-slate-500">
					No public timelines published yet.
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each data.publicTimelines as tl}
						<a
							href="/timeline/{tl.id}"
							class="block p-5 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-lg transition-all group"
						>
							<div class="flex items-center justify-between gap-2 mb-3">
								<span class="text-xs text-slate-400">By {tl.ownerName || 'User'}</span>
								<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 capitalize">
									{tl.defaultView}
								</span>
							</div>

							<h3 class="font-bold text-white text-base group-hover:text-indigo-400 transition-colors line-clamp-1">
								{tl.title}
							</h3>
							<p class="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
								{tl.description || 'Public timeline.'}
							</p>

							<div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
								<span>{new Date(tl.createdAt).toLocaleDateString()}</span>
								<span class="text-indigo-400 inline-flex items-center gap-1 font-medium">
									View &rarr;
								</span>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- Create Timeline Modal -->
{#if isCreateModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
		<div class="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
			<div class="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
				<h3 class="text-base font-bold text-white">Create New Timeline</h3>
				<button
					type="button"
					onclick={() => (isCreateModalOpen = false)}
					class="p-1 rounded-lg text-slate-400 hover:text-white"
				>
					<X class="w-5 h-5" />
				</button>
			</div>

			<form
				action="?/createTimeline"
				method="POST"
				use:enhance={() => {
					creating = true;
					return async ({ update }) => {
						creating = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="tl-title" class="block text-xs font-semibold text-slate-300 mb-1">Timeline Title</label>
					<input
						type="text"
						id="tl-title"
						name="title"
						bind:value={newTitle}
						required
						placeholder="e.g. Renaissance Art or Mars Colonization"
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
					/>
				</div>

				<div>
					<label for="tl-desc" class="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
					<textarea
						id="tl-desc"
						name="description"
						bind:value={newDescription}
						rows="3"
						placeholder="Brief summary or context..."
						class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
					></textarea>
				</div>

				<div>
					<div class="block text-xs font-semibold text-slate-300 mb-1">Default View</div>
					<div class="grid grid-cols-3 gap-2">
						<label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 cursor-pointer text-center hover:bg-slate-800/50 transition-all {newDefaultView === 'horizontal' ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300' : 'text-slate-400'}">
							<input type="radio" name="default_view" value="horizontal" bind:group={newDefaultView} class="sr-only" />
							<SlidersHorizontal class="w-4 h-4 mb-1" />
							<span class="text-xs font-medium">Band</span>
						</label>

						<label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 cursor-pointer text-center hover:bg-slate-800/50 transition-all {newDefaultView === 'vertical' ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300' : 'text-slate-400'}">
							<input type="radio" name="default_view" value="vertical" bind:group={newDefaultView} class="sr-only" />
							<LayoutList class="w-4 h-4 mb-1" />
							<span class="text-xs font-medium">Feed</span>
						</label>

						<label class="flex flex-col items-center justify-center p-2.5 rounded-xl border border-slate-800 cursor-pointer text-center hover:bg-slate-800/50 transition-all {newDefaultView === 'gantt' ? 'bg-indigo-950/50 border-indigo-500 text-indigo-300' : 'text-slate-400'}">
							<input type="radio" name="default_view" value="gantt" bind:group={newDefaultView} class="sr-only" />
							<Kanban class="w-4 h-4 mb-1" />
							<span class="text-xs font-medium">Gantt</span>
						</label>
					</div>
				</div>

				<div class="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
					<div>
						<div class="text-xs font-semibold text-white">Public Visibility</div>
						<div class="text-[11px] text-slate-400">Anyone with the link can view without login</div>
					</div>
					<label class="relative inline-flex items-center cursor-pointer">
						<input type="checkbox" name="is_public" bind:checked={newIsPublic} class="sr-only peer" />
						<div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
					</label>
				</div>

				<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
					<button
						type="button"
						onclick={() => (isCreateModalOpen = false)}
						class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={creating}
						class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/30"
					>
						{creating ? 'Creating...' : 'Create & Open'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
