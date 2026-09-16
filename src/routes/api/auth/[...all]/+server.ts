import { getAuth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
	const auth = await getAuth();
	return auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
	const auth = await getAuth();
	return auth.handler(request);
};
