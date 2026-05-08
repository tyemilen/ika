import { relations } from 'drizzle-orm';
import { index, integer, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';

import { books } from './books';
import { metaAuthors } from '../meta';

export const authors = booksSchema.table(
	'authors',
	{
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		authorId: uuid('author_id')
			.notNull()
			.references(() => metaAuthors.id, { onDelete: 'restrict' }),
	},
	(t) => [
		primaryKey({ columns: [t.bookId, t.authorId] }),
		index('authors_author_id_idx').on(t.authorId),
	],
);

export const authorsRelations = relations(authors, ({ one }) => ({
	book: one(books, {
		fields: [authors.bookId],
		references: [books.id],
	}),

	author: one(metaAuthors, {
		fields: [authors.authorId],
		references: [metaAuthors.id],
	}),
}));
