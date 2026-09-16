import { error, fail, redirect } from '@sveltejs/kit';
import { db, timelines, events, timelineCollaborators, auditLogs, users } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
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

	// Fetch timeline owner details
	const [owner] = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email
		})
		.from(users)
		.where(eq(users.id, timeline.ownerId))
		.limit(1);

	// Fetch collaborators
	const collaborators = await db
		.select({
			id: timelineCollaborators.id,
			userId: timelineCollaborators.userId,
			name: users.name,
			email: users.email,
			role: timelineCollaborators.role,
			createdAt: timelineCollaborators.createdAt
		})
		.from(timelineCollaborators)
		.innerJoin(users, eq(timelineCollaborators.userId, users.id))
		.where(eq(timelineCollaborators.timelineId, timelineId));

	// Initial events
	const initialEvents = await db
		.select()
		.from(events)
		.where(eq(events.timelineId, timelineId))
		.orderBy(events.startYear);

	return {
		timeline,
		owner,
		collaborators,
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
	},

	updateTimeline: async ({ request, locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Only the timeline owner can modify settings.' });
		}

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim() ?? '';
		const defaultView = (data.get('default_view') as string) || 'horizontal';

		if (!title) {
			return fail(400, { error: 'Title cannot be empty.' });
		}

		await db
			.update(timelines)
			.set({
				title,
				description,
				defaultView,
				updatedAt: new Date()
			})
			.where(eq(timelines.id, timelineId));

		return { success: true, message: 'Timeline settings updated successfully.' };
	},

	togglePublic: async ({ locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Only the timeline owner can change visibility.' });
		}

		const newIsPublic = !timeline.isPublic;
		await db
			.update(timelines)
			.set({
				isPublic: newIsPublic,
				updatedAt: new Date()
			})
			.where(eq(timelines.id, timelineId));

		return {
			success: true,
			message: newIsPublic ? 'Timeline is now public to anyone with the link.' : 'Timeline is now private.'
		};
	},

	addCollaborator: async ({ request, locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Only the timeline owner can manage collaborators.' });
		}

		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const role = (data.get('role') as string) || 'editor';

		if (!email) {
			return fail(400, { error: 'Please enter a collaborator email.' });
		}

		const [targetUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (!targetUser) {
			return fail(404, { error: `No registered user found with email "${email}". They must create an account first.` });
		}

		if (targetUser.id === timeline.ownerId) {
			return fail(400, { error: 'This user is already the owner of this timeline.' });
		}

		// Check if already collaborator
		const [existing] = await db
			.select()
			.from(timelineCollaborators)
			.where(
				and(
					eq(timelineCollaborators.timelineId, timelineId),
					eq(timelineCollaborators.userId, targetUser.id)
				)
			)
			.limit(1);

		if (existing) {
			await db
				.update(timelineCollaborators)
				.set({ role })
				.where(eq(timelineCollaborators.id, existing.id));
			return { success: true, message: `Updated collaborator permissions for ${targetUser.name}.` };
		}

		await db.insert(timelineCollaborators).values({
			id: crypto.randomUUID(),
			timelineId,
			userId: targetUser.id,
			role,
			createdAt: new Date()
		});

		return { success: true, message: `Added ${targetUser.name} as ${role}.` };
	},

	updateCollaboratorRole: async ({ request, locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Permission denied.' });
		}

		const data = await request.formData();
		const collabId = data.get('collab_id') as string;
		const role = (data.get('role') as string) || 'editor';

		if (!collabId) return fail(400, { error: 'Missing collaborator ID' });

		await db
			.update(timelineCollaborators)
			.set({ role })
			.where(
				and(
					eq(timelineCollaborators.id, collabId),
					eq(timelineCollaborators.timelineId, timelineId)
				)
			);

		return { success: true, message: 'Collaborator role updated.' };
	},

	removeCollaborator: async ({ request, locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Permission denied.' });
		}

		const data = await request.formData();
		const collabId = data.get('collab_id') as string;

		if (!collabId) return fail(400, { error: 'Missing collaborator ID' });

		await db
			.delete(timelineCollaborators)
			.where(
				and(
					eq(timelineCollaborators.id, collabId),
					eq(timelineCollaborators.timelineId, timelineId)
				)
			);

		return { success: true, message: 'Collaborator removed.' };
	},

	deleteTimeline: async ({ locals, params }) => {
		const timelineId = params.id;
		const currentUser = locals.user;

		const [timeline] = await db.select().from(timelines).where(eq(timelines.id, timelineId)).limit(1);
		if (!timeline) return fail(404, { error: 'Timeline not found' });
		if (!currentUser || (currentUser.role !== 'superadmin' && timeline.ownerId !== currentUser.id)) {
			return fail(403, { error: 'Only the timeline owner can delete this timeline.' });
		}

		await db.delete(timelines).where(eq(timelines.id, timelineId));
		throw redirect(303, '/');
	}
};
