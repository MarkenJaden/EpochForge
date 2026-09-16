import { fail, redirect } from '@sveltejs/kit';
import { isFirstRun } from '$lib/server/settings';
import { getAuth } from '$lib/server/auth';
import { db, users } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const firstRun = await isFirstRun();
	if (!firstRun) {
		throw redirect(302, '/login');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const firstRun = await isFirstRun();
		if (!firstRun) {
			return fail(400, { error: 'EpochForge is already initialized. Setup is locked.' });
		}

		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const password = data.get('password') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		if (!name || !email || !password) {
			return fail(400, { error: 'Please fill out all required fields.' });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		try {
			const auth = await getAuth();
			// Register initial user via Better-Auth
			const res = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
				}
			});

			if (!res || !res.user) {
				return fail(500, { error: 'Failed to create super-admin user.' });
			}

			// Unchangeably set role to 'superadmin'
			await db.update(users).set({ role: 'superadmin' }).where(eq(users.id, res.user.id));

			return { success: true };
		} catch (err: any) {
			console.error('Setup error:', err);
			return fail(500, { error: err?.message || 'Initialization failed.' });
		}
	}
};
