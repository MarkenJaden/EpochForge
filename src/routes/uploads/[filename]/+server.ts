import { error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { RequestHandler } from './$types';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve('uploads');

const MIME_MAP: Record<string, string> = {
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.gif': 'image/gif',
	'.svg': 'image/svg+xml'
};

export const GET: RequestHandler = async ({ params }) => {
	const filename = path.basename(params.filename);
	const filePath = path.join(UPLOAD_DIR, filename);

	try {
		const data = await fs.readFile(filePath);
		const ext = path.extname(filename).toLowerCase();
		const contentType = MIME_MAP[ext] || 'application/octet-stream';

		return new Response(data, {
			headers: {
				'Content-Type': contentType,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (e) {
		throw error(404, 'File not found');
	}
};
