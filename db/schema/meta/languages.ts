import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { metaSchema } from './schema';
import { sql } from 'drizzle-orm';

export const metaLanguages = metaSchema.table('metaLanguages', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	code: varchar('code', { length: 10 }).notNull().unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
