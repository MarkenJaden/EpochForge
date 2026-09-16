import { redirect } from '@sveltejs/kit';
import { getActivePublicProviders, getInstanceConfig } from '$lib/server/settings';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user) {
		const target = url.searchParams.get('redirect') || '/';
		throw redirect(302, target);
	}

	const [providers, instance] = await Promise.all([
		getActivePublicProviders(),
		getInstanceConfig()
	]);

	return {
		providers,
		instance,
		redirectUrl: url.searchParams.get('redirect') || '/'
	};
};
