import { error, redirect } from '@sveltejs/kit';
import { getInstanceConfig } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/');
	}

	const instance = await getInstanceConfig();
	if (!instance.registrationAllowed) {
		throw error(403, 'Public registration is currently disabled by the administrator.');
	}

	return {
		instance
	};
};
