import { getAuth } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token') || '';
	return { token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const token = (data.get('token') as string)?.trim();
		const password = (data.get('password') as string) || '';
		const confirmPassword = (data.get('confirm_password') as string) || '';

		if (!token) {
			return fail(400, { error: 'Invalid or missing password reset token.' });
		}

		if (!password || password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}

		try {
			const auth = await getAuth();
			await auth.api.resetPassword({
				body: {
					token,
					newPassword: password
				}
			});

			return {
				success: true,
				message: 'Your password has been successfully reset! You can now sign in.'
			};
		} catch (err: any) {
			console.error('Failed to reset password:', err);
			return fail(400, {
				error: err?.message || 'The reset link is invalid or has expired. Please request a new one.'
			});
		}
	}
};
