<script lang="ts">
	import { signUp } from '$lib/auth-client';
	import { Sparkles, User, Mail, Lock, UserPlus, AlertCircle } from 'lucide-svelte';

	let { data } = $props();

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleRegister(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = null;

		if (password !== confirmPassword) {
			error = 'Passwords do not match.';
			loading = false;
			return;
		}

		try {
			const res = await signUp.email({
				email,
				password,
				name
			});

			if (res.error) {
				error = res.error.message || 'Registration failed.';
				loading = false;
				return;
			}

			window.location.href = '/';
		} catch (err: any) {
			error = err?.message || 'Failed to create account.';
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
	<div class="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl shadow-indigo-950/40">
		<div class="text-center mb-8">
			<div class="inline-flex p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-500/10">
				<Sparkles class="w-8 h-8" />
			</div>
			<h1 class="text-3xl font-bold text-white tracking-tight">Join EpochForge</h1>
			<p class="text-sm text-slate-400 mt-2">Create your account to start building timelines</p>
		</div>

		{#if error}
			<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0" />
				<span>{error}</span>
			</div>
		{/if}

		<form onsubmit={handleRegister} class="space-y-4">
			<div>
				<label for="name" class="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
				<div class="relative">
					<User class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						placeholder="Jane Doe"
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
						bind:value={email}
						required
						placeholder="name@example.com"
						class="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
				<div class="relative">
					<Lock class="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="password"
						id="password"
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
					<span>Creating Account...</span>
				{:else}
					<UserPlus class="w-4 h-4" />
					<span>Create Account</span>
				{/if}
			</button>
		</form>

		<p class="text-center text-xs text-slate-400 mt-6">
			Already have an account?
			<a href="/login" class="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</a>
		</p>
	</div>
</div>
