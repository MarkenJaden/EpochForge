<script lang="ts">
	import '../app.css';
	import { theme } from '$lib/stores/theme.svelte';

	let { children } = $props();
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-500 selection:text-white transition-colors duration-150">
	{@render children()}
</div>
