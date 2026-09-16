<script lang="ts">
	import { enhance } from '$app/forms';
	import { Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-svelte';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
	<div class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40">
		<div class="text-center mb-8">
			<div class="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
				<Sparkles class="w-8 h-8" />
			</div>
			<h1 class="text-2xl font-bold text-white tracking-tight">Create New Password</h1>
			<p class="text-sm text-slate-400 mt-2">Enter a new secure password for your account</p>
		</div>

		{#if form?.message}
			<div class="mb-6 bg-emerald-950/50 border border-emerald-800/50 rounded-xl p-5 text-sm text-emerald-300 space-y-3">
				<div class="flex items-center gap-3">
					<CheckCircle2 class="w-5 h-5 flex-shrink-0" />
					<span class="font-medium">{form.message}</span>
				</div>
				<a
					href="/login"
					class="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-xl transition-all"
				>
					<span>Sign In to Your Account</span>
					<ArrowRight class="w-4 h-4" />
				</a>
			</div>
		{/if}

		{#if form?.error}
			<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0" />
				<span>{form.error}</span>
			</div>
		{/if}

		{#if !form?.success}
			{#if !data.token}
				<div class="bg-amber-950/50 border border-amber-800/50 rounded-xl p-4 text-sm text-amber-300 flex items-start gap-3 mb-6">
					<AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
					<div>
						<p class="font-medium">Missing Reset Token</p>
						<p class="text-xs text-amber-400/80 mt-1">This link is incomplete. Please click the full reset link provided in your email.</p>
					</div>
				</div>
				<a href="/forgot-password" class="w-full inline-flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-sm transition-colors">
					Request a new link
				</a>
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
					<input type="hidden" name="token" value={data.token} />

					<div>
						<label for="password" class="block text-xs font-medium text-slate-300 mb-1.5">New Password</label>
						<div class="relative">
							<Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="password"
								id="password"
								name="password"
								required
								minlength="8"
								placeholder="At least 8 characters"
								class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
							/>
						</div>
					</div>

					<div>
						<label for="confirm_password" class="block text-xs font-medium text-slate-300 mb-1.5">Confirm New Password</label>
						<div class="relative">
							<Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
							<input
								type="password"
								id="confirm_password"
								name="confirm_password"
								required
								minlength="8"
								placeholder="Repeat new password"
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
							<span>Updating Password...</span>
						{:else}
							<Lock class="w-4 h-4" />
							<span>Reset Password</span>
						{/if}
					</button>
				</form>
			{/if}
		{/if}
	</div>
</div>
