import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { metaSchema } from './schema';
import { sql } from 'drizzle-orm';

export const metaArtists = metaSchema.table('metaArtists', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	slug: varchar('slug', { length: 156 }).notNull().unique(),
	name: varchar('name', { length: 128 }).notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
