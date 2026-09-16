import { db, systemSettings, users } from '$lib/server/db';
import { eq, sql } from 'drizzle-orm';
import { encryptSecret, decryptSecret } from '$lib/server/crypto';

export interface SocialProviderConfig {
	id: 'google' | 'github' | 'discord' | 'oidc';
	name: string;
	enabled: boolean;
	clientId: string;
	clientSecret: string;
	discoveryUrl?: string;
	callbackUrl: string;
}

export interface InstanceConfig {
	instanceName: string;
	logoUrl: string;
	registrationAllowed: boolean;
	maxUploadSizeMb: number;
}

/**
 * Checks if the system is completely new (no users in database).
 * If true, First-Run Wizard (/setup) must be shown.
 */
export async function isFirstRun(): Promise<boolean> {
	try {
		const result = await db.select({ count: sql<number>`count(*)::int` }).from(users);
		return (result[0]?.count ?? 0) === 0;
	} catch (e) {
		// If DB table doesn't exist yet or connection error, allow setup or handle gracefully
		return true;
	}
}

/**
 * Retrieves a single setting by key, decrypting if necessary.
 */
export async function getSetting(key: string, defaultValue = ''): Promise<string> {
	try {
		const rows = await db.select().from(systemSettings).where(eq(systemSettings.key, key)).limit(1);
		if (rows.length === 0) return defaultValue;
		const row = rows[0];
		return row.encrypted ? decryptSecret(row.value) : row.value;
	} catch (err) {
		console.error(`Error fetching setting ${key}:`, err);
		return defaultValue;
	}
}

/**
 * Sets a single setting, encrypting sensitive fields if needed.
 */
export async function setSetting(key: string, value: string, encrypted = false): Promise<void> {
	const storedValue = encrypted ? encryptSecret(value) : value;
	await db
		.insert(systemSettings)
		.values({
			key,
			value: storedValue,
			encrypted,
			updatedAt: new Date()
		})
		.onConflictDoUpdate({
			target: systemSettings.key,
			set: {
				value: storedValue,
				encrypted,
				updatedAt: new Date()
			}
		});
}

/**
 * Retrieves all OAuth social provider configurations for Admin Settings.
 */
export async function getAllSocialProviders(baseUrl: string): Promise<SocialProviderConfig[]> {
	const [
		googleEnabled,
		googleClientId,
		googleClientSecret,
		githubEnabled,
		githubClientId,
		githubClientSecret,
		discordEnabled,
		discordClientId,
		discordClientSecret,
		oidcEnabled,
		oidcClientId,
		oidcClientSecret,
		oidcDiscoveryUrl
	] = await Promise.all([
		getSetting('auth_google_enabled', 'false'),
		getSetting('auth_google_client_id', ''),
		getSetting('auth_google_client_secret', ''),
		getSetting('auth_github_enabled', 'false'),
		getSetting('auth_github_client_id', ''),
		getSetting('auth_github_client_secret', ''),
		getSetting('auth_discord_enabled', 'false'),
		getSetting('auth_discord_client_id', ''),
		getSetting('auth_discord_client_secret', ''),
		getSetting('auth_oidc_enabled', 'false'),
		getSetting('auth_oidc_client_id', ''),
		getSetting('auth_oidc_client_secret', ''),
		getSetting('auth_oidc_discovery_url', '')
	]);

	const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

	return [
		{
			id: 'google',
			name: 'Google',
			enabled: googleEnabled === 'true',
			clientId: googleClientId,
			clientSecret: googleClientSecret,
			callbackUrl: `${cleanBaseUrl}/api/auth/callback/google`
		},
		{
			id: 'github',
			name: 'GitHub',
			enabled: githubEnabled === 'true',
			clientId: githubClientId,
			clientSecret: githubClientSecret,
			callbackUrl: `${cleanBaseUrl}/api/auth/callback/github`
		},
		{
			id: 'discord',
			name: 'Discord',
			enabled: discordEnabled === 'true',
			clientId: discordClientId,
			clientSecret: discordClientSecret,
			callbackUrl: `${cleanBaseUrl}/api/auth/callback/discord`
		},
		{
			id: 'oidc',
			name: 'OpenID Connect',
			enabled: oidcEnabled === 'true',
			clientId: oidcClientId,
			clientSecret: oidcClientSecret,
			discoveryUrl: oidcDiscoveryUrl,
			callbackUrl: `${cleanBaseUrl}/api/auth/callback/oidc`
		}
	];
}

/**
 * Returns only the active and configured social providers (for public Login UI).
 * Does NOT expose client secrets!
 */
export async function getActivePublicProviders(): Promise<Array<{ id: string; name: string }>> {
	const [googleEnabled, googleClientId, githubEnabled, githubClientId, discordEnabled, discordClientId, oidcEnabled, oidcClientId] =
		await Promise.all([
			getSetting('auth_google_enabled', 'false'),
			getSetting('auth_google_client_id', ''),
			getSetting('auth_github_enabled', 'false'),
			getSetting('auth_github_client_id', ''),
			getSetting('auth_discord_enabled', 'false'),
			getSetting('auth_discord_client_id', ''),
			getSetting('auth_oidc_enabled', 'false'),
			getSetting('auth_oidc_client_id', '')
		]);

	const list: Array<{ id: string; name: string }> = [];

	if (googleEnabled === 'true' && googleClientId.trim()) {
		list.push({ id: 'google', name: 'Google' });
	}
	if (githubEnabled === 'true' && githubClientId.trim()) {
		list.push({ id: 'github', name: 'GitHub' });
	}
	if (discordEnabled === 'true' && discordClientId.trim()) {
		list.push({ id: 'discord', name: 'Discord' });
	}
	if (oidcEnabled === 'true' && oidcClientId.trim()) {
		list.push({ id: 'oidc', name: 'Custom OIDC' });
	}

	return list;
}

/**
 * Retrieves instance general settings.
 */
export async function getInstanceConfig(): Promise<InstanceConfig> {
	const [instanceName, logoUrl, registrationAllowed, maxUploadSizeMb] = await Promise.all([
		getSetting('instance_name', 'EpochForge'),
		getSetting('logo_url', ''),
		getSetting('auth_registration_allowed', 'true'),
		getSetting('max_upload_size_mb', '25')
	]);

	return {
		instanceName,
		logoUrl,
		registrationAllowed: registrationAllowed === 'true',
		maxUploadSizeMb: parseInt(maxUploadSizeMb, 10) || 25
	};
}
