import { fail, redirect } from '@sveltejs/kit';
import { db, timelines, timelineCollaborators, users } from '$lib/server/db';
import { eq, or, desc } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const currentUser = locals.user;

	// Public timelines (viewable by anyone)
	const publicTimelines = await db
		.select({
			id: timelines.id,
			title: timelines.title,
			description: timelines.description,
			isPublic: timelines.isPublic,
			defaultView: timelines.defaultView,
			createdAt: timelines.createdAt,
			ownerName: users.name
		})
		.from(timelines)
		.leftJoin(users, eq(timelines.ownerId, users.id))
		.where(eq(timelines.isPublic, true))
		.orderBy(desc(timelines.createdAt))
		.limit(20);

	let myTimelines: any[] = [];
	if (currentUser) {
		myTimelines = await db
			.select({
				id: timelines.id,
				title: timelines.title,
				description: timelines.description,
				isPublic: timelines.isPublic,
				defaultView: timelines.defaultView,
				createdAt: timelines.createdAt
			})
			.from(timelines)
			.where(eq(timelines.ownerId, currentUser.id))
			.orderBy(desc(timelines.createdAt));
	}

	return {
		user: currentUser,
		publicTimelines,
		myTimelines
	};
};

export const actions: Actions = {
	createTimeline: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(302, '/login');
		}

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim() || '';
		const isPublic = data.get('is_public') === 'on';
		const defaultView = (data.get('default_view') as string) || 'horizontal';

		if (!title) {
			return fail(400, { error: 'Title is required.' });
		}

		const timelineId = crypto.randomUUID();

		await db.insert(timelines).values({
			id: timelineId,
			title,
			description,
			isPublic,
			defaultView,
			ownerId: locals.user.id,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		throw redirect(302, `/timeline/${timelineId}`);
	}
};
