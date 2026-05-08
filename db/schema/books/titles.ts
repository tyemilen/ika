import { relations, sql } from 'drizzle-orm';
import { boolean, index, text, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { books } from './books';
import { users } from '../users';
import { metaLanguages } from '../meta';

export const titles = booksSchema.table(
	'titles',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),

		title: text('name').notNull(),

		langId: uuid('lang_id')
			.notNull()
			.references(() => metaLanguages.id, { onDelete: 'restrict' }),

		isPrimary: boolean('is_primary').notNull().default(false),

		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
	},
	(t) => [index('titles_book_id_idx').on(t.bookId)],
);

export const titlesRelations = relations(titles, ({ one }) => ({
	book: one(books, {
		fields: [titles.bookId],
		references: [books.id],
	}),

	language: one(metaLanguages, {
		fields: [titles.langId],
		references: [metaLanguages.id],
	}),

	createdBy: one(users, {
		fields: [titles.createdBy],
		references: [users.id],
	}),
}));
