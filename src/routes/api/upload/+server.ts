import { json, error } from '@sveltejs/kit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getInstanceConfig } from '$lib/server/settings';
import type { RequestHandler } from './$types';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.resolve('uploads');

// Ensure directory exists
async function ensureUploadDir() {
	try {
		await fs.mkdir(UPLOAD_DIR, { recursive: true });
	} catch (e) {}
}

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	await ensureUploadDir();
	const instance = await getInstanceConfig();
	const maxSizeBytes = instance.maxUploadSizeMb * 1024 * 1024;

	const formData = await request.formData();
	const file = formData.get('file') as File;

	if (!file || typeof file === 'string') {
		throw error(400, 'No file uploaded.');
	}

	if (file.size > maxSizeBytes) {
		throw error(400, `File size exceeds the maximum limit of ${instance.maxUploadSizeMb}MB.`);
	}

	// Allowed MIME types
	const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];
	if (!allowedTypes.includes(file.type)) {
		throw error(400, 'Invalid file type. Only PNG, JPEG, WebP, GIF and SVG are allowed.');
	}

	const ext = path.extname(file.name) || '.png';
	const filename = `${crypto.randomUUID()}${ext}`;
	const targetPath = path.join(UPLOAD_DIR, filename);

	const buffer = Buffer.from(await file.arrayBuffer());
	await fs.writeFile(targetPath, buffer);

	return json({
		success: true,
		url: `/uploads/${filename}`,
		size: file.size,
		filename
	});
};
