import { error } from '@sveltejs/kit';
import { db, timelines, events } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const timelineId = params.id;

	const [timeline] = await db
		.select()
		.from(timelines)
		.where(eq(timelines.id, timelineId))
		.limit(1);

	if (!timeline) {
		throw error(404, 'Timeline not found');
	}

	if (!timeline.isPublic) {
		throw error(403, 'This timeline is private and cannot be embedded publicly.');
	}

	const initialEvents = await db
		.select()
		.from(events)
		.where(eq(events.timelineId, timelineId))
		.orderBy(events.startYear);

	return {
		timeline,
		events: initialEvents
	};
};
