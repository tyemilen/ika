import type { GlideClient } from '@valkey/valkey-glide';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

import type * as schema from '../../db';

declare module 'nitropack' {
	interface NitroRuntimeHooks {
		'app:user:notification': (payload: {
			type: string;
			notificationId: string;
		}) => void | Promise<void>;
	}
	interface NitroApp {
		valkey: GlideClient;
		db: NodePgDatabase<typeof schema>;
	}
}
