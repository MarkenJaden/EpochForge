<script lang="ts">
	import { theme } from '$lib/stores/theme.svelte';
	import { Sun, Moon } from 'lucide-svelte';
</script>

<button
	type="button"
	onclick={() => theme.toggle()}
	class="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
	title={theme.current === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
	aria-label="Toggle theme"
>
	{#if theme.current === 'dark'}
		<Sun class="w-4 h-4 text-amber-400 animate-in spin-in-90 duration-200" />
	{:else}
		<Moon class="w-4 h-4 text-indigo-600 animate-in spin-in-90 duration-200" />
	{/if}
</button>
