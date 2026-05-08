import { sql } from 'drizzle-orm';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { draftsSchema } from './schema';
import { books } from '../books';

export const draftAuthors = draftsSchema.table('authors', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	bookId: uuid('book_id')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 64 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
