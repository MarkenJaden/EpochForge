<script lang="ts">
	import { enhance } from '$app/forms';
	import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Sparkles } from 'lucide-svelte';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
	<div class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40">
		<div class="text-center mb-8">
			<div class="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
				<Sparkles class="w-8 h-8" />
			</div>
			<h1 class="text-2xl font-bold text-white tracking-tight">Reset Password</h1>
			<p class="text-sm text-slate-400 mt-2">Enter your email and we'll send you a recovery link</p>
		</div>

		{#if form?.message}
			<div class="mb-6 bg-emerald-950/50 border border-emerald-800/50 rounded-xl p-4 text-sm text-emerald-300 flex items-start gap-3">
				<CheckCircle2 class="w-5 h-5 flex-shrink-0 mt-0.5" />
				<div>
					<p class="font-medium">Check your inbox</p>
					<p class="text-xs text-emerald-400/80 mt-1">{form.message}</p>
				</div>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		{#if !form?.success}
			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="email" class="block text-xs font-medium text-slate-300 mb-1.5">Account Email</label>
					<div class="relative">
						<Mail class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="name@example.com"
							class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={loading}
					class="w-full mt-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.99]"
				>
					{#if loading}
						<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
						<span>Sending Reset Link...</span>
					{:else}
						<Mail class="w-4 h-4" />
						<span>Send Reset Link</span>
					{/if}
				</button>
			</form>
		{/if}

		<div class="mt-8 text-center border-t border-slate-800/80 pt-6">
			<a href="/login" class="inline-flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
				<ArrowLeft class="w-3.5 h-3.5" />
				<span>Back to Sign In</span>
			</a>
		</div>
	</div>
</div>
