import { Meilisearch } from 'meilisearch';

export default defineNitroPlugin(async (nitroApp) => {
	const config = useRuntimeConfig();
	const meilisearch = new Meilisearch({
		host: config.meiliHost,
		apiKey: config.meiliKey,
	});
	nitroApp.hooks.hook('request', async (event) => {
		event.context.meilisearch = meilisearch;
	});
});
