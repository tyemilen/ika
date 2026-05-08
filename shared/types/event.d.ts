import 'h3';
import type { Meilisearch } from 'meilisearch';
import type { GlideClient } from '@valkey/valkey-glide';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { S3mini } from 's3mini';

import type * as schema from '../../db';

declare module 'h3' {
	interface H3EventContext {
		valkey: GlideClient;
		s3: S3mini;
		meilisearch: Meilisearch;
		db: NodePgDatabase<typeof schema>;
	}
}
