import http from 'node:http';
import dotenv from 'dotenv';
import { Server } from '@hocuspocus/server';
import * as Y from 'yjs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const DATABASE_URL =
	process.env.DATABASE_URL || 'postgresql://epochforge:epochforge_secret@localhost:5432/epochforge';

// Initialize Postgres client for Hocuspocus persistence & migrations
const sql = postgres(DATABASE_URL, { prepare: false });

// Run DB migrations automatically
async function initDb() {
	for (let i = 0; i < 15; i++) {
		try {
			const db = drizzle(sql);
			await migrate(db, { migrationsFolder: './drizzle' });
			console.log('EpochForge database migrations successfully applied.');
			return;
		} catch (err) {
			console.warn(`Database migration pending (attempt ${i + 1}/15): ${err.message}`);
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}
}
initDb();

const hocuspocus = Server.configure({
	name: 'epochforge-collab-prod',
	debounce: 1000,
	maxDebounce: 5000,

	async onLoadDocument(data) {
		const timelineId = data.documentName;
		const ydoc = new Y.Doc();

		try {
			const rows = await sql`
				SELECT doc_state FROM timeline_yjs_docs WHERE timeline_id = ${timelineId} LIMIT 1
			`;

			if (rows.length > 0 && rows[0].doc_state) {
				const uint8 = Buffer.from(rows[0].doc_state, 'base64');
				Y.applyUpdate(ydoc, uint8);
				return ydoc;
			}

			// If no saved state, load from events table
			const timelineEvents = await sql`
				SELECT * FROM events WHERE timeline_id = ${timelineId} ORDER BY start_year ASC
			`;

			const yEvents = ydoc.getArray('events');
			const initialArray = timelineEvents.map((evt) => {
				const map = new Y.Map();
				map.set('id', evt.id);
				map.set('title', evt.title);
				map.set('description', evt.description || '');
				map.set('startYear', evt.start_year);
				map.set('startDate', evt.start_date);
				map.set('endYear', evt.end_year ?? null);
				map.set('endDate', evt.end_date ?? null);
				map.set('isSpan', evt.is_span);
				map.set('color', evt.color || '#6366f1');
				map.set('bgImageUrl', evt.bg_image_url || '');
				map.set('bgPattern', evt.bg_pattern || '');
				map.set('tags', evt.tags || []);
				map.set('metadata', evt.metadata || {});
				return map;
			});

			ydoc.transact(() => {
				yEvents.push(initialArray);
			});

			return ydoc;
		} catch (err) {
			console.error(`Error loading Yjs doc for ${timelineId}:`, err);
			return ydoc;
		}
	},

	async onStoreDocument(data) {
		const timelineId = data.documentName;
		try {
			const update = Y.encodeStateAsUpdate(data.document);
			const base64 = Buffer.from(update).toString('base64');

			await sql`
				INSERT INTO timeline_yjs_docs (timeline_id, doc_state, updated_at)
				VALUES (${timelineId}, ${base64}, NOW())
				ON CONFLICT (timeline_id)
				DO UPDATE SET doc_state = ${base64}, updated_at = NOW()
			`;
		} catch (err) {
			console.error(`Error saving Yjs doc for ${timelineId}:`, err);
		}
	}
});

// Import SvelteKit handler dynamically
let handler;
try {
	const module = await import('./build/handler.js');
	handler = module.handler;
} catch (e) {
	console.warn('Production build handler not found yet. Run npm run build first.');
}

const server = http.createServer((req, res) => {
	if (handler) {
		handler(req, res);
	} else {
		res.writeHead(503, { 'Content-Type': 'text/plain' });
		res.end('Application is building or unavailable.');
	}
});

server.on('upgrade', (request, socket, head) => {
	if (request.url?.startsWith('/ws')) {
		hocuspocus.handleConnection(socket, request, head);
	}
});

server.listen(PORT, '0.0.0.0', () => {
	console.log(`EpochForge server running on http://0.0.0.0:${PORT} (WebSocket on /ws)`);
});
