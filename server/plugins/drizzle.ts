import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import * as schema from '../../db';

export default defineNitroPlugin(async (nitroApp) => {
	const config = useRuntimeConfig();

	const pool = new pg.Pool({
		connectionString: config.databaseUrl,
	});

	const db = drizzle(pool, {
		schema,
	});

	const listen = async () => {
		const client = await pool.connect();

		const setup = async () => {
			await client.query('LISTEN new_chapter');
			await client.query('LISTEN book_update');
		};

		client.on('notification', (msg) => {
			nitroApp.hooks.callHook('app:user:notification', {
				type: msg.channel,
				notificationId: msg.payload as string,
			});
		});

		client.on('error', async (err) => {
			console.error('[pg/listener]', err);
			try {
				client.release();
			} catch {}
			setTimeout(listen, 1000);
		});

		await setup();
	};

	listen();

	nitroApp.hooks.hook('request', async (event) => {
		event.context.db = db;
	});

	nitroApp.db = db;
});
