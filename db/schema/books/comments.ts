import { relations, sql } from 'drizzle-orm';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { users } from '../users';
import { books } from './books';

export const bookComments = booksSchema.table('comments', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	bookId: uuid('book_id')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
	text: varchar('text', { length: 512 }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export const bookCommentsRelations = relations(bookComments, ({ one }) => ({
	book: one(books, {
		fields: [bookComments.bookId],
		references: [books.id],
	}),
}));
