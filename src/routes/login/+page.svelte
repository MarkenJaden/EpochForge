<script lang="ts">
	import { signIn } from '$lib/auth-client';
	import { Sparkles, Mail, Lock, LogIn, AlertCircle, Github, Globe } from 'lucide-svelte';

	let { data } = $props();

	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function handleEmailLogin(e: SubmitEvent) {
		e.preventDefault();
		loading = true;
		error = null;

		try {
			const res = await signIn.email({
				email,
				password
			});

			if (res.error) {
				error = res.error.message || 'Invalid email or password.';
				loading = false;
				return;
			}

			window.location.href = data.redirectUrl;
		} catch (err: any) {
			error = err?.message || 'Login failed. Please try again.';
			loading = false;
		}
	}

	async function handleSocialLogin(providerId: string) {
		loading = true;
		error = null;
		try {
			await signIn.social({
				provider: providerId as any,
				callbackURL: data.redirectUrl
			});
		} catch (err: any) {
			error = err?.message || `Failed to sign in with ${providerId}.`;
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
			<h1 class="text-3xl font-bold text-white tracking-tight">{data.instance.instanceName}</h1>
			<p class="text-sm text-slate-400 mt-2">Sign in to your timeline workspace</p>
		</div>

		{#if error}
			<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
				<AlertCircle class="w-5 h-5 flex-shrink-0" />
				<span>{error}</span>
			</div>
		{/if}

		<!-- Dynamic Social Login Providers (Only rendered if configured in Admin) -->
		{#if data.providers.length > 0}
			<div class="space-y-2.5 mb-6">
				{#each data.providers as provider}
					<button
						type="button"
						onclick={() => handleSocialLogin(provider.id)}
						disabled={loading}
						class="w-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 text-white font-medium py-2.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all hover:border-slate-600"
					>
						{#if provider.id === 'github'}
							<Github class="w-5 h-5" />
						{:else if provider.id === 'google'}
							<svg class="w-5 h-5" viewBox="0 0 24 24">
								<path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"/>
								<path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
								<path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z"/>
								<path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16.5C3.7 20.2 7.5 23.5 12 23.5z"/>
							</svg>
						{:else}
							<Globe class="w-5 h-5 text-indigo-400" />
						{/if}
						<span>Continue with {provider.name}</span>
					</button>
				{/each}
			</div>

			<div class="relative flex items-center justify-center mb-6">
				<div class="border-t border-slate-800 w-full"></div>
				<span class="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider font-semibold">or email</span>
				<div class="border-t border-slate-800 w-full"></div>
			</div>
		{/if}

		<form onsubmit={handleEmailLogin} class="space-y-4">
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
					<span>Signing in...</span>
				{:else}
					<LogIn class="w-4 h-4" />
					<span>Sign In</span>
				{/if}
			</button>
		</form>

		{#if data.instance.registrationAllowed}
			<p class="text-center text-xs text-slate-400 mt-6">
				Don't have an account yet?
				<a href="/register" class="text-indigo-400 hover:text-indigo-300 font-medium">Create one</a>
			</p>
		{:else}
			<p class="text-center text-xs text-slate-500 mt-6">
				Public registration is disabled on this instance.
			</p>
		{/if}
	</div>
</div>
