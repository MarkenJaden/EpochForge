import { fail } from '@sveltejs/kit';
import {
	getAllSocialProviders,
	getInstanceConfig,
	setSetting
} from '$lib/server/settings';
import { invalidateAuthCache } from '$lib/server/auth';
import { db, timelines, users, auditLogs, timelineCollaborators } from '$lib/server/db';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const origin = url.origin;
	const [providers, instance, allTimelines, allUsers, logs] = await Promise.all([
		getAllSocialProviders(origin),
		getInstanceConfig(),
		db
			.select({
				id: timelines.id,
				title: timelines.title,
				description: timelines.description,
				isPublic: timelines.isPublic,
				defaultView: timelines.defaultView,
				createdAt: timelines.createdAt,
				ownerId: timelines.ownerId,
				ownerName: users.name,
				ownerEmail: users.email
			})
			.from(timelines)
			.leftJoin(users, eq(timelines.ownerId, users.id))
			.orderBy(desc(timelines.createdAt)),
		db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role
			})
			.from(users)
			.orderBy(users.name),
		db
			.select({
				id: auditLogs.id,
				timelineId: auditLogs.timelineId,
				userId: auditLogs.userId,
				userName: users.name,
				action: auditLogs.action,
				entityType: auditLogs.entityType,
				entityId: auditLogs.entityId,
				diff: auditLogs.diff,
				source: auditLogs.source,
				createdAt: auditLogs.createdAt
			})
			.from(auditLogs)
			.leftJoin(users, eq(auditLogs.userId, users.id))
			.orderBy(desc(auditLogs.createdAt))
			.limit(50)
	]);

	return {
		providers,
		instance,
		timelines: allTimelines,
		users: allUsers,
		auditLogs: logs
	};
};

export const actions: Actions = {
	saveAuth: async ({ request }) => {
		const data = await request.formData();

		// Registration allowed
		const registrationAllowed = data.get('registration_allowed') === 'on' ? 'true' : 'false';
		await setSetting('auth_registration_allowed', registrationAllowed);

		// Google
		const googleEnabled = data.get('google_enabled') === 'on' ? 'true' : 'false';
		const googleClientId = (data.get('google_client_id') as string)?.trim() || '';
		const googleClientSecret = (data.get('google_client_secret') as string)?.trim();
		await setSetting('auth_google_enabled', googleEnabled);
		await setSetting('auth_google_client_id', googleClientId);
		if (googleClientSecret) {
			await setSetting('auth_google_client_secret', googleClientSecret, true);
		}

		// GitHub
		const githubEnabled = data.get('github_enabled') === 'on' ? 'true' : 'false';
		const githubClientId = (data.get('github_client_id') as string)?.trim() || '';
		const githubClientSecret = (data.get('github_client_secret') as string)?.trim();
		await setSetting('auth_github_enabled', githubEnabled);
		await setSetting('auth_github_client_id', githubClientId);
		if (githubClientSecret) {
			await setSetting('auth_github_client_secret', githubClientSecret, true);
		}

		// Discord
		const discordEnabled = data.get('discord_enabled') === 'on' ? 'true' : 'false';
		const discordClientId = (data.get('discord_client_id') as string)?.trim() || '';
		const discordClientSecret = (data.get('discord_client_secret') as string)?.trim();
		await setSetting('auth_discord_enabled', discordEnabled);
		await setSetting('auth_discord_client_id', discordClientId);
		if (discordClientSecret) {
			await setSetting('auth_discord_client_secret', discordClientSecret, true);
		}

		// OIDC
		const oidcEnabled = data.get('oidc_enabled') === 'on' ? 'true' : 'false';
		const oidcClientId = (data.get('oidc_client_id') as string)?.trim() || '';
		const oidcClientSecret = (data.get('oidc_client_secret') as string)?.trim();
		const oidcDiscoveryUrl = (data.get('oidc_discovery_url') as string)?.trim() || '';
		await setSetting('auth_oidc_enabled', oidcEnabled);
		await setSetting('auth_oidc_client_id', oidcClientId);
		if (oidcClientSecret) {
			await setSetting('auth_oidc_client_secret', oidcClientSecret, true);
		}
		await setSetting('auth_oidc_discovery_url', oidcDiscoveryUrl);

		// Invalidate auth runtime cache so changes take effect immediately
		invalidateAuthCache();

		return { success: true, message: 'Authentication settings saved successfully.' };
	},

	saveSystem: async ({ request }) => {
		const data = await request.formData();
		const instanceName = (data.get('instance_name') as string)?.trim() || 'EpochForge';
		const logoUrl = (data.get('logo_url') as string)?.trim() || '';
		const maxUploadSizeMb = (data.get('max_upload_size_mb') as string)?.trim() || '25';

		await setSetting('instance_name', instanceName);
		await setSetting('logo_url', logoUrl);
		await setSetting('max_upload_size_mb', maxUploadSizeMb);

		return { success: true, message: 'System settings updated.' };
	},

	assignModerator: async ({ request }) => {
		const data = await request.formData();
		const timelineId = data.get('timeline_id') as string;
		const userId = data.get('user_id') as string;
		const role = (data.get('role') as string) || 'editor';

		if (!timelineId || !userId) {
			return fail(400, { error: 'Timeline ID and User ID required.' });
		}

		await db
			.insert(timelineCollaborators)
			.values({
				id: crypto.randomUUID(),
				timelineId,
				userId,
				role
			})
			.onConflictDoNothing();

		return { success: true, message: 'Moderator assigned.' };
	}
};
