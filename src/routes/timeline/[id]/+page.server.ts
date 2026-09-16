import { error, fail } from '@sveltejs/kit';
import { db, timelines, events, timelineCollaborators, auditLogs, users } from '$lib/server/db';
import { eq, and, or } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const timelineId = params.id;

	// Fetch timeline
	const [timeline] = await db
		.select()
		.from(timelines)
		.where(eq(timelines.id, timelineId))
		.limit(1);

	if (!timeline) {
		throw error(404, 'Timeline not found');
	}

	const currentUser = locals.user;
	let userRole: 'owner' | 'editor' | 'viewer' | null = null;

	if (currentUser) {
		if (currentUser.role === 'superadmin' || timeline.ownerId === currentUser.id) {
			userRole = 'owner';
		} else {
			const [collab] = await db
				.select()
				.from(timelineCollaborators)
				.where(
					and(
						eq(timelineCollaborators.timelineId, timelineId),
						eq(timelineCollaborators.userId, currentUser.id)
					)
				)
				.limit(1);

			if (collab) {
				userRole = collab.role as any;
			}
		}
	}

	// If timeline is private and user has no role, forbid access
	if (!timeline.isPublic && !userRole) {
		throw error(403, 'You do not have permission to view this private timeline.');
	}

	// Default role for anonymous visitors on public timelines is 'viewer'
	if (!userRole) {
		userRole = 'viewer';
	}

	// Initial events
	const initialEvents = await db
		.select()
		.from(events)
		.where(eq(events.timelineId, timelineId))
		.orderBy(events.startYear);

	return {
		timeline,
		initialEvents,
		userRole,
		currentUser: currentUser ? { id: currentUser.id, name: currentUser.name } : undefined
	};
};

export const actions: Actions = {
	recordAudit: async ({ request, locals, params }) => {
		const data = await request.formData();
		const action = (data.get('action') as string) || 'update';
		const entityType = (data.get('entity_type') as string) || 'event';
		const entityId = (data.get('entity_id') as string) || '';
		const diffRaw = (data.get('diff') as string) || '{}';

		let diff = {};
		try {
			diff = JSON.parse(diffRaw);
		} catch (e) {}

		await db.insert(auditLogs).values({
			id: crypto.randomUUID(),
			timelineId: params.id,
			userId: locals.user?.id || null,
			action,
			entityType,
			entityId,
			diff,
			source: 'web',
			createdAt: new Date()
		});

		return { success: true };
	}
};
