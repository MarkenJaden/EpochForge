import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import { db, timelineYjsDocs, events, timelines } from '$lib/server/db';
import { eq } from 'drizzle-orm';

/**
 * Configure Hocuspocus Server with PostgreSQL persistence.
 */
export const hocuspocusServer = Server.configure({
	name: 'epochforge-collab-server',
	debounce: 1000,
	maxDebounce: 5000,

	async onLoadDocument(data) {
		const timelineId = data.documentName;
		const ydoc = new Y.Doc();

		try {
			// 1. Check if Yjs doc already persisted in DB
			const rows = await db
				.select()
				.from(timelineYjsDocs)
				.where(eq(timelineYjsDocs.timelineId, timelineId))
				.limit(1);

			if (rows.length > 0 && rows[0].docState) {
				const uint8 = Buffer.from(rows[0].docState, 'base64');
				Y.applyUpdate(ydoc, uint8);
				return ydoc;
			}

			// 2. If no Yjs doc exists yet, initialize it from DB events table
			const timelineEvents = await db
				.select()
				.from(events)
				.where(eq(events.timelineId, timelineId));

			const yEvents = ydoc.getArray('events');
			const initialArray = timelineEvents.map((evt) => {
				const map = new Y.Map();
				map.set('id', evt.id);
				map.set('title', evt.title);
				map.set('description', evt.description || '');
				map.set('startYear', evt.startYear);
				map.set('startDate', evt.startDate);
				map.set('endYear', evt.endYear ?? null);
				map.set('endDate', evt.endDate ?? null);
				map.set('isSpan', evt.isSpan);
				map.set('color', evt.color || '#6366f1');
				map.set('bgImageUrl', evt.bgImageUrl || '');
				map.set('bgPattern', evt.bgPattern || '');
				map.set('tags', evt.tags || []);
				map.set('metadata', evt.metadata || {});
				return map;
			});

			ydoc.transact(() => {
				yEvents.push(initialArray);
			});

			return ydoc;
		} catch (err) {
			console.error(`Error loading Yjs document for timeline ${timelineId}:`, err);
			return ydoc;
		}
	},

	async onStoreDocument(data) {
		const timelineId = data.documentName;
		try {
			const update = Y.encodeStateAsUpdate(data.document);
			const base64 = Buffer.from(update).toString('base64');

			await db
				.insert(timelineYjsDocs)
				.values({
					timelineId,
					docState: base64,
					updatedAt: new Date()
				})
				.onConflictDoUpdate({
					target: timelineYjsDocs.timelineId,
					set: {
						docState: base64,
						updatedAt: new Date()
					}
				});
		} catch (err) {
			console.error(`Error storing Yjs document for timeline ${timelineId}:`, err);
		}
	}
});
