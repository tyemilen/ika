import { relations, sql } from 'drizzle-orm';
import { boolean, index, timestamp, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';

import { books } from './books';

export const covers = booksSchema.table(
	'covers',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		isPrimary: boolean('is_primary').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [index('covers_book_id_idx').on(t.bookId)],
);

export const coversRelations = relations(covers, ({ one }) => ({
	book: one(books, {
		fields: [covers.bookId],
		references: [books.id],
	}),
}));
