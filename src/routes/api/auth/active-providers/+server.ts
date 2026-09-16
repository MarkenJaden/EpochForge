import { json } from '@sveltejs/kit';
import { getActivePublicProviders, getInstanceConfig } from '$lib/server/settings';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const [providers, instance] = await Promise.all([
		getActivePublicProviders(),
		getInstanceConfig()
	]);

	return json({
		providers,
		instance: {
			instanceName: instance.instanceName,
			logoUrl: instance.logoUrl,
			registrationAllowed: instance.registrationAllowed
		}
	});
};
