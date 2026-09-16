<script lang="ts">
	import { enhance } from '$app/forms';
	import { Shield, Sparkles, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-svelte';

	let { form } = $props();

	let loading = $state(false);
	let password = $state('');
	let confirmPassword = $state('');
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
	<div class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40">
		<div class="text-center mb-8">
			<div class="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
				<Sparkles class="w-8 h-8 animate-pulse" />
			</div>
			<h1 class="text-3xl font-bold text-white tracking-tight">EpochForge</h1>
			<p class="text-sm text-slate-400 mt-2">First-Run Setup & Super-Admin Initialization</p>
		</div>

		<div class="mb-6 bg-indigo-950/40 border border-indigo-800/40 rounded-xl p-4 text-xs text-indigo-200 flex items-start gap-3">
			<Shield class="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
			<div>
				<span class="font-semibold text-indigo-300">Super-Admin Privilege:</span>
				The first registered account is irrevocably designated as the instance Super-Admin. Once created, this setup wizard is permanently locked.
			</div>
		</div>

		{#if form?.error}
			<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-6 bg-emerald-950/50 border border-emerald-800/50 rounded-xl p-4 text-sm text-emerald-300 flex items-center gap-3">
				<CheckCircle2 class="w-5 h-5 flex-shrink-0" />
				<div>
					<span class="font-semibold">Initialization successful!</span>
					<div class="mt-1">
						<a href="/login" class="underline hover:text-emerald-200">Proceed to Login &rarr;</a>
					</div>
				</div>
			</div>
		{:else}
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
					<label for="name" class="block text-xs font-medium text-slate-300 mb-1.5">Super-Admin Name</label>
					<div class="relative">
						<User class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="text"
							id="name"
							name="name"
							required
							placeholder="Admin Master"
							class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
						/>
					</div>
				</div>

				<div>
					<label for="email" class="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
					<div class="relative">
						<Mail class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="email"
							id="email"
							name="email"
							required
							placeholder="admin@epochforge.org"
							class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-xs font-medium text-slate-300 mb-1.5">Master Password</label>
					<div class="relative">
						<Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="password"
							id="password"
							name="password"
							bind:value={password}
							required
							minlength="8"
							placeholder="••••••••••••"
							class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
						/>
					</div>
				</div>

				<div>
					<label for="confirmPassword" class="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
					<div class="relative">
						<Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
						<input
							type="password"
							id="confirmPassword"
							name="confirmPassword"
							bind:value={confirmPassword}
							required
							minlength="8"
							placeholder="••••••••••••"
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
						<span>Initializing Instance...</span>
					{:else}
						<span>Initialize & Create Super-Admin</span>
						<ArrowRight class="w-4 h-4" />
					{/if}
				</button>
			</form>
		{/if}
	</div>
</div>
