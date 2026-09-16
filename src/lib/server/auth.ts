import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { getSetting } from './settings';
import * as dotenv from 'dotenv';
dotenv.config();

let cachedAuth: ReturnType<typeof betterAuth> | null = null;
let lastSettingsHash = '';

/**
 * Creates or retrieves the Better-Auth instance.
 * Rebuilds the instance dynamically if admin updates OAuth settings in the DB.
 */
export async function getAuth() {
	const [
		googleEnabled,
		googleClientId,
		googleClientSecret,
		githubEnabled,
		githubClientId,
		githubClientSecret,
		discordEnabled,
		discordClientId,
		discordClientSecret
	] = await Promise.all([
		getSetting('auth_google_enabled', 'false'),
		getSetting('auth_google_client_id', ''),
		getSetting('auth_google_client_secret', ''),
		getSetting('auth_github_enabled', 'false'),
		getSetting('auth_github_client_id', ''),
		getSetting('auth_github_client_secret', ''),
		getSetting('auth_discord_enabled', 'false'),
		getSetting('auth_discord_client_id', ''),
		getSetting('auth_discord_client_secret', '')
	]);

	const currentHash = `${googleEnabled}:${googleClientId}:${googleClientSecret}:${githubEnabled}:${githubClientId}:${githubClientSecret}:${discordEnabled}:${discordClientId}:${discordClientSecret}`;

	if (cachedAuth && lastSettingsHash === currentHash) {
		return cachedAuth;
	}

	const socialProviders: Record<string, any> = {};

	if (googleEnabled === 'true' && googleClientId && googleClientSecret) {
		socialProviders.google = {
			clientId: googleClientId,
			clientSecret: googleClientSecret
		};
	}

	if (githubEnabled === 'true' && githubClientId && githubClientSecret) {
		socialProviders.github = {
			clientId: githubClientId,
			clientSecret: githubClientSecret
		};
	}

	if (discordEnabled === 'true' && discordClientId && discordClientSecret) {
		socialProviders.discord = {
			clientId: discordClientId,
			clientSecret: discordClientSecret
		};
	}

	const auth = betterAuth({
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: {
				user: schema.users,
				session: schema.sessions,
				account: schema.accounts,
				verification: schema.verifications
			}
		}),
		secret: process.env.BETTER_AUTH_SECRET || 'temporary-secret-at-least-32-chars-long-epochforge',
		baseURL: process.env.BETTER_AUTH_URL || process.env.ORIGIN || 'http://localhost:3000',
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false
		},
		user: {
			additionalFields: {
				role: {
					type: 'string',
					defaultValue: 'user'
				}
			}
		},
		socialProviders
	});

	cachedAuth = auth;
	lastSettingsHash = currentHash;
	return auth;
}

/**
 * Invalidate cached auth so next request picks up updated OAuth credentials.
 */
export function invalidateAuthCache() {
	cachedAuth = null;
	lastSettingsHash = '';
}
