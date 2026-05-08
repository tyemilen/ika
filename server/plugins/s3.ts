import 'dotenv/config';

import S3mini from 's3mini';

export default defineNitroPlugin(async (nitroApp) => {
	const config = useRuntimeConfig();
	const s3client = new S3mini({
		accessKeyId: config.s3AccessKey,
		secretAccessKey: config.s3SecretKey,
		endpoint: config.s3Endpoint,
		region: 'us-east-1',
	});

	nitroApp.hooks.hook('request', async (event) => {
		event.context.s3 = s3client;
	});
});
