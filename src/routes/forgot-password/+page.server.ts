import { getInstanceConfig } from '$lib/server/settings';
import { getAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async () => {
	const instance = await getInstanceConfig();
	return { instance };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();

		if (!email) {
			return fail(400, { error: 'Please enter your email address.' });
		}

		try {
			const auth = await getAuth();
			await auth.api.requestPasswordReset({
				body: {
					email,
					redirectTo: '/reset-password'
				}
			});

			return {
				success: true,
				message: 'If an account exists with this email address, a password reset link has been dispatched.'
			};
		} catch (err: any) {
			console.error('Password reset request error:', err);
			return {
				success: true,
				message: 'If an account exists with this email address, a password reset link has been dispatched.'
			};
		}
	}
};
