import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { metaSchema } from './schema';
import { sql } from 'drizzle-orm';

export const metaThemes = metaSchema.table('metaThemes', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	name: varchar('name', { length: 64 }).notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
