import { redirect, type Handle } from '@sveltejs/kit';
import { getAuth } from '$lib/server/auth';
import { isFirstRun } from '$lib/server/settings';

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	// Ignore internal assets, favicon, uploads
	if (
		pathname.startsWith('/_app') ||
		pathname.startsWith('/favicon') ||
		pathname.startsWith('/uploads')
	) {
		return resolve(event);
	}

	// 1. Check First-Run Wizard
	const firstRun = await isFirstRun();

	if (firstRun) {
		// If system is uninitialized, redirect to /setup unless already on /setup or auth API
		if (!pathname.startsWith('/setup') && !pathname.startsWith('/api/setup')) {
			throw redirect(302, '/setup');
		}
	} else {
		// If system is initialized, permanently lock /setup
		if (pathname === '/setup' || pathname.startsWith('/setup/')) {
			throw redirect(302, '/login');
		}
	}

	// 2. Resolve Better-Auth Session
	try {
		const auth = await getAuth();
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		if (session) {
			event.locals.user = {
				id: session.user.id,
				email: session.user.email,
				name: session.user.name,
				role: (session.user as any).role || 'user',
				image: session.user.image
			};
			event.locals.session = {
				id: session.session.id,
				userId: session.session.userId,
				expiresAt: session.session.expiresAt
			};
		} else {
			event.locals.user = null;
			event.locals.session = null;
		}
	} catch (err) {
		event.locals.user = null;
		event.locals.session = null;
	}

	// 3. Protect Admin Routes
	if (pathname.startsWith('/admin')) {
		if (!event.locals.user) {
			throw redirect(302, `/login?redirect=${encodeURIComponent(pathname)}`);
		}
		if (event.locals.user.role !== 'superadmin') {
			throw redirect(302, '/');
		}
	}

	return resolve(event);
};
