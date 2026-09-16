<script lang="ts">
	import { enhance } from '$app/forms';
	import {
		Shield,
		Key,
		Settings,
		Users,
		History,
		Copy,
		Check,
		Save,
		Eye,
		EyeOff,
		ExternalLink,
		CheckCircle2,
		AlertCircle,
		Bot,
		Globe,
		Calendar,
		Mail,
		Send
	} from 'lucide-svelte';

	let { data, form } = $props();

	let activeTab = $state<'auth' | 'smtp' | 'system' | 'moderation' | 'audit'>('auth');
	let copiedId = $state<string | null>(null);
	let testingEmail = $state(false);
	let showSecrets = $state<Record<string, boolean>>({});
	let saving = $state(false);

	function copyToClipboard(text: string, id: string) {
		navigator.clipboard.writeText(text);
		copiedId = id;
		setTimeout(() => {
			if (copiedId === id) copiedId = null;
		}, 2000);
	}

	function toggleSecret(id: string) {
		showSecrets[id] = !showSecrets[id];
	}
</script>

<div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
	<!-- Top Bar -->
	<header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
		<div class="flex items-center gap-3">
			<a href="/" class="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors">
				<div class="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
					<Shield class="w-4 h-4 text-indigo-400" />
				</div>
				<span class="font-bold text-lg text-white">EpochForge Admin</span>
			</a>
			<span class="text-xs px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
				Super-Admin Dashboard
			</span>
		</div>

		<div class="flex items-center gap-3">
			<a href="/" class="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
				Back to Workspace
			</a>
		</div>
	</header>

	<div class="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col md:flex-row gap-8">
		<!-- Sidebar Navigation -->
		<aside class="w-full md:w-64 flex-shrink-0 space-y-1">
			<button
				onclick={() => (activeTab = 'auth')}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {activeTab === 'auth' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
			>
				<Key class="w-4 h-4" />
				<span>Auth & Providers</span>
			</button>

			<button
				onclick={() => (activeTab = 'smtp')}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {activeTab === 'smtp' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
			>
				<Mail class="w-4 h-4" />
				<span>SMTP & Email</span>
			</button>

			<button
				onclick={() => (activeTab = 'system')}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {activeTab === 'system' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
			>
				<Settings class="w-4 h-4" />
				<span>System Settings</span>
			</button>

			<button
				onclick={() => (activeTab = 'moderation')}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {activeTab === 'moderation' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
			>
				<Users class="w-4 h-4" />
				<span>Global Moderation</span>
			</button>

			<button
				onclick={() => (activeTab = 'audit')}
				class="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all {activeTab === 'audit' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}"
			>
				<History class="w-4 h-4" />
				<span>Global Audit Logs</span>
			</button>
		</aside>

		<!-- Main Content Area -->
		<main class="flex-1 min-w-0">
			{#if form?.message}
				<div class="mb-6 bg-emerald-950/50 border border-emerald-800/50 rounded-xl p-4 text-sm text-emerald-300 flex items-center gap-3">
					<CheckCircle2 class="w-5 h-5 flex-shrink-0" />
					<span>{form.message}</span>
				</div>
			{/if}

			{#if form?.error}
				<div class="mb-6 bg-rose-950/50 border border-rose-800/50 rounded-xl p-4 text-sm text-rose-300 flex items-center gap-3">
					<AlertCircle class="w-5 h-5 flex-shrink-0" />
					<span>{form.error}</span>
				</div>
			{/if}

			<!-- Tab 1: Auth & Providers -->
			{#if activeTab === 'auth'}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold text-white">Authentication & Dynamic Social Logins</h2>
						<p class="text-xs text-slate-400 mt-1">
							Configure OAuth providers and registration access. Client secrets are encrypted with AES-256-GCM in the database.
						</p>
					</div>

					<form
						action="?/saveAuth"
						method="POST"
						use:enhance={() => {
							saving = true;
							return async ({ update }) => {
								saving = false;
								await update();
							};
						}}
						class="space-y-6"
					>
						<!-- Registration Switch -->
						<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
							<div>
								<div class="text-sm font-semibold text-white">Allow Public Registration</div>
								<div class="text-xs text-slate-400 mt-0.5">Allow new users to register an account independently</div>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									name="registration_allowed"
									checked={data.instance.registrationAllowed}
									class="sr-only peer"
								/>
								<div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
							</label>
						</div>

						<!-- Social Providers Grid -->
						<div class="space-y-4">
							{#each data.providers as provider}
								<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-200">
												{provider.name[0]}
											</div>
											<div>
												<h3 class="font-semibold text-white text-base">{provider.name}</h3>
												<span class="text-xs {provider.enabled ? 'text-emerald-400' : 'text-slate-500'} font-medium">
													{provider.enabled ? 'Enabled in Login UI' : 'Disabled'}
												</span>
											</div>
										</div>

										<label class="relative inline-flex items-center cursor-pointer">
											<input
												type="checkbox"
												name="{provider.id}_enabled"
												checked={provider.enabled}
												class="sr-only peer"
											/>
											<div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
										</label>
									</div>

									<!-- Callback URL with Copy helper -->
									<div>
										<span class="block text-xs font-medium text-slate-400 mb-1">
											Authorized Redirect / Callback URL
										</span>
										<div class="flex items-center gap-2">
											<input
												type="text"
												readonly
												value={provider.callbackUrl}
												class="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-300 select-all"
											/>
											<button
												type="button"
												onclick={() => copyToClipboard(provider.callbackUrl, provider.id)}
												class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1.5 transition-all"
											>
												{#if copiedId === provider.id}
													<Check class="w-3.5 h-3.5 text-emerald-400" />
													<span class="text-emerald-400 font-medium">Copied</span>
												{:else}
													<Copy class="w-3.5 h-3.5" />
													<span>Copy</span>
												{/if}
											</button>
										</div>
									</div>

									<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<label for="{provider.id}_client_id" class="block text-xs font-medium text-slate-400 mb-1">
												Client ID
											</label>
											<input
												type="text"
												id="{provider.id}_client_id"
												name="{provider.id}_client_id"
												value={provider.clientId}
												placeholder="{provider.name} Client ID"
												class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
											/>
										</div>

										<div>
											<label for="{provider.id}_client_secret" class="block text-xs font-medium text-slate-400 mb-1">
												Client Secret
											</label>
											<div class="relative">
												<input
													type={showSecrets[provider.id] ? 'text' : 'password'}
													id="{provider.id}_client_secret"
													name="{provider.id}_client_secret"
													placeholder={provider.clientSecret ? '•••••••••••••••• (Encrypted in DB)' : 'Enter Secret'}
													class="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
												/>
												<button
													type="button"
													onclick={() => toggleSecret(provider.id)}
													class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
												>
													{#if showSecrets[provider.id]}
														<EyeOff class="w-3.5 h-3.5" />
													{:else}
														<Eye class="w-3.5 h-3.5" />
													{/if}
												</button>
											</div>
										</div>
									</div>

									{#if provider.id === 'oidc'}
										<div>
											<label for="oidc_discovery_url" class="block text-xs font-medium text-slate-400 mb-1">
												OIDC Discovery URL (Well-Known Configuration)
											</label>
											<input
												type="url"
												id="oidc_discovery_url"
												name="oidc_discovery_url"
												value={provider.discoveryUrl || ''}
												placeholder="https://auth.example.com/.well-known/openid-configuration"
												class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
											/>
										</div>
									{/if}
								</div>
							{/each}
						</div>

						<button
							type="submit"
							disabled={saving}
							class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
						>
							<Save class="w-4 h-4" />
							<span>{saving ? 'Saving...' : 'Save Authentication Settings'}</span>
						</button>
					</form>
				</div>
			{/if}

			<!-- Tab: SMTP & Email Settings -->
			{#if activeTab === 'smtp'}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold text-white">SMTP & Email Delivery</h2>
						<p class="text-xs text-slate-400 mt-1">
							Configure outgoing email settings for password resets, team invites, and system notifications. Password is encrypted with AES-256 in the database.
						</p>
					</div>

					<form
						action="?/saveSmtp"
						method="POST"
						use:enhance={() => {
							saving = true;
							return async ({ update }) => {
								saving = false;
								await update();
							};
						}}
						class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-6"
					>
						<!-- Enable SMTP Switch -->
						<div class="flex items-center justify-between pb-5 border-b border-slate-800/80">
							<div>
								<div class="text-sm font-semibold text-white">Enable Outgoing Email</div>
								<div class="text-xs text-slate-400 mt-0.5">Activate SMTP delivery for invitations and password resets</div>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									name="smtp_enabled"
									checked={data.smtp?.enabled}
									class="sr-only peer"
								/>
								<div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
							</label>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="smtp_host" class="block text-xs font-medium text-slate-400 mb-1">SMTP Host</label>
								<input
									type="text"
									id="smtp_host"
									name="smtp_host"
									value={data.smtp?.host || ''}
									placeholder="smtp.example.com"
									class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
								/>
							</div>

							<div>
								<label for="smtp_port" class="block text-xs font-medium text-slate-400 mb-1">SMTP Port</label>
								<input
									type="number"
									id="smtp_port"
									name="smtp_port"
									value={data.smtp?.port || 587}
									placeholder="587"
									class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
								/>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label for="smtp_user" class="block text-xs font-medium text-slate-400 mb-1">SMTP Username / User</label>
								<input
									type="text"
									id="smtp_user"
									name="smtp_user"
									value={data.smtp?.user || ''}
									placeholder="user@example.com"
									class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
								/>
							</div>

							<div>
								<label for="smtp_password" class="block text-xs font-medium text-slate-400 mb-1">
									SMTP Password
									{#if data.smtp?.hasPassword}
										<span class="text-emerald-400 font-normal ml-1">(Configured &bull; leave blank to retain)</span>
									{/if}
								</label>
								<div class="relative">
									<input
										type={showSecrets['smtp_pass'] ? 'text' : 'password'}
										id="smtp_password"
										name="smtp_password"
										placeholder={data.smtp?.hasPassword ? '••••••••••••' : 'Enter SMTP password'}
										class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
									/>
									<button
										type="button"
										onclick={() => toggleSecret('smtp_pass')}
										class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
									>
										{#if showSecrets['smtp_pass']}
											<EyeOff class="w-4 h-4" />
										{:else}
											<Eye class="w-4 h-4" />
										{/if}
									</button>
								</div>
							</div>
						</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
							<div>
								<label for="smtp_from" class="block text-xs font-medium text-slate-400 mb-1">From Sender Address</label>
								<input
									type="text"
									id="smtp_from"
									name="smtp_from"
									value={data.smtp?.from || 'EpochForge <noreply@epochforge.markenjaden.de>'}
									placeholder="EpochForge <noreply@epochforge.markenjaden.de>"
									class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
								/>
							</div>

							<div class="pt-5 flex items-center gap-3">
								<input
									type="checkbox"
									id="smtp_secure"
									name="smtp_secure"
									checked={data.smtp?.secure}
									class="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
								/>
								<label for="smtp_secure" class="text-xs text-slate-300 select-none">
									Use SSL/TLS (Implicit TLS, typically port 465). If unchecked, STARTTLS on 587 is used.
								</label>
							</div>
						</div>

						<button
							type="submit"
							disabled={saving}
							class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
						>
							<Save class="w-4 h-4" />
							<span>{saving ? 'Saving...' : 'Save SMTP Settings'}</span>
						</button>
					</form>

					<!-- Send Test Email Card -->
					<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4">
						<div class="flex items-center gap-3">
							<div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
								<Send class="w-5 h-5 text-indigo-400" />
							</div>
							<div>
								<h3 class="font-semibold text-white text-base">Send Test Email</h3>
								<p class="text-xs text-slate-400">Verify your SMTP configuration by dispatching a test email instantly.</p>
							</div>
						</div>

						<form
							action="?/testSmtp"
							method="POST"
							use:enhance={() => {
								testingEmail = true;
								return async ({ update }) => {
									testingEmail = false;
									await update();
								};
							}}
							class="flex flex-col sm:flex-row gap-3 pt-2"
						>
							<input
								type="email"
								name="test_email"
								required
								placeholder="recipient@example.com"
								class="flex-1 bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
							/>
							<button
								type="submit"
								disabled={testingEmail}
								class="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center justify-center gap-2 border border-slate-700 transition-all"
							>
								<Send class="w-4 h-4 text-indigo-400" />
								<span>{testingEmail ? 'Sending...' : 'Send Test Email'}</span>
							</button>
						</form>
					</div>
				</div>
			{/if}

			<!-- Tab 2: System Settings -->
			{#if activeTab === 'system'}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold text-white">General System Settings</h2>
						<p class="text-xs text-slate-400 mt-1">Configure instance branding and global resource limits.</p>
					</div>

					<form
						action="?/saveSystem"
						method="POST"
						use:enhance={() => {
							saving = true;
							return async ({ update }) => {
								saving = false;
								await update();
							};
						}}
						class="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-4"
					>
						<div>
							<label for="instance_name" class="block text-xs font-medium text-slate-400 mb-1">Instance Name</label>
							<input
								type="text"
								id="instance_name"
								name="instance_name"
								value={data.instance.instanceName}
								class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>

						<div>
							<label for="logo_url" class="block text-xs font-medium text-slate-400 mb-1">Custom Logo URL</label>
							<input
								type="url"
								id="logo_url"
								name="logo_url"
								value={data.instance.logoUrl}
								placeholder="https://example.com/logo.png"
								class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
							/>
						</div>

						<div>
							<label for="max_upload_size_mb" class="block text-xs font-medium text-slate-400 mb-1">Max Upload Limit per Media File (MB)</label>
							<input
								type="number"
								id="max_upload_size_mb"
								name="max_upload_size_mb"
								min="1"
								max="200"
								value={data.instance.maxUploadSizeMb}
								class="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
							/>
						</div>

						<button
							type="submit"
							disabled={saving}
							class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
						>
							<Save class="w-4 h-4" />
							<span>{saving ? 'Saving...' : 'Save System Settings'}</span>
						</button>
					</form>
				</div>
			{/if}

			<!-- Tab 3: Global Moderation -->
			{#if activeTab === 'moderation'}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold text-white">Global Timeline Moderation</h2>
						<p class="text-xs text-slate-400 mt-1">
							Full administrative oversight of all timelines and moderator role assignments.
						</p>
					</div>

					<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
						<div class="p-4 border-b border-slate-800 text-sm font-semibold text-white">
							All Registered Timelines ({data.timelines.length})
						</div>
						<div class="divide-y divide-slate-800/60">
							{#if data.timelines.length === 0}
								<div class="p-8 text-center text-sm text-slate-500">No timelines created yet.</div>
							{:else}
								{#each data.timelines as timeline}
									<div class="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
										<div>
											<div class="flex items-center gap-2">
												<span class="font-semibold text-white">{timeline.title}</span>
												<span class="text-[10px] px-2 py-0.5 rounded-full {timeline.isPublic ? 'bg-emerald-950 border border-emerald-800 text-emerald-300' : 'bg-slate-800 text-slate-400'}">
													{timeline.isPublic ? 'Public' : 'Private'}
												</span>
												<span class="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
													View: {timeline.defaultView}
												</span>
											</div>
											<div class="text-xs text-slate-400 mt-1">
												Owner: <span class="text-slate-300">{timeline.ownerName}</span> ({timeline.ownerEmail}) • Created: {new Date(timeline.createdAt).toLocaleDateString()}
											</div>
										</div>

										<div class="flex items-center gap-2">
											<a
												href="/timeline/{timeline.id}"
												class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs flex items-center gap-1.5 transition-all"
											>
												<ExternalLink class="w-3.5 h-3.5" />
												<span>Open</span>
											</a>

											<!-- Assign Moderator Form -->
											<form action="?/assignModerator" method="POST" use:enhance class="flex items-center gap-1.5">
												<input type="hidden" name="timeline_id" value={timeline.id} />
												<select
													name="user_id"
													class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
												>
													<option value="">Assign User...</option>
													{#each data.users as u}
														<option value={u.id}>{u.name} ({u.role})</option>
													{/each}
												</select>
												<select
													name="role"
													class="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
												>
													<option value="editor">Editor</option>
													<option value="viewer">Viewer</option>
												</select>
												<button
													type="submit"
													class="px-2.5 py-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-lg text-xs font-medium"
												>
													Assign
												</button>
											</form>
										</div>
									</div>
								{/each}
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Tab 4: Audit Logs -->
			{#if activeTab === 'audit'}
				<div class="space-y-6">
					<div>
						<h2 class="text-xl font-bold text-white">Global Audit Logs</h2>
						<p class="text-xs text-slate-400 mt-1">
							Immutable trace of all timeline operations. AI agent operations are tagged with [Agent/MCP].
						</p>
					</div>

					<div class="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden">
						<div class="overflow-x-auto">
							<table class="w-full text-left text-xs">
								<thead class="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
									<tr>
										<th class="py-3 px-4">Timestamp</th>
										<th class="py-3 px-4">Source</th>
										<th class="py-3 px-4">Actor</th>
										<th class="py-3 px-4">Action</th>
										<th class="py-3 px-4">Entity</th>
										<th class="py-3 px-4">Diff Details</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-slate-800/60 text-slate-300">
									{#if data.auditLogs.length === 0}
										<tr>
											<td colspan="6" class="py-8 text-center text-slate-500">No audit logs recorded yet.</td>
										</tr>
									{:else}
										{#each data.auditLogs as log}
											<tr class="hover:bg-slate-800/30 transition-colors">
												<td class="py-3 px-4 font-mono text-slate-400">
													{new Date(log.createdAt).toLocaleString()}
												</td>
												<td class="py-3 px-4">
													{#if log.source === 'agent_mcp'}
														<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-950 border border-purple-800 text-purple-300 font-semibold text-[10px]">
															<Bot class="w-3 h-3" />
															[Agent/MCP]
														</span>
													{:else}
														<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
															<Globe class="w-3 h-3" />
															Web UI
														</span>
													{/if}
												</td>
												<td class="py-3 px-4 font-medium text-white">
													{log.userName || log.userId || 'System'}
												</td>
												<td class="py-3 px-4">
													<span class="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
														{log.action}
													</span>
												</td>
												<td class="py-3 px-4 font-mono text-slate-400">
													{log.entityType} ({log.entityId?.slice(0, 8) || 'N/A'})
												</td>
												<td class="py-3 px-4 font-mono text-[11px] text-slate-400 max-w-xs truncate">
													{JSON.stringify(log.diff)}
												</td>
											</tr>
										{/each}
									{/if}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
</div>
