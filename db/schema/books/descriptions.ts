import { relations, sql } from 'drizzle-orm';
import { index, text, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { books } from './books';
import { users } from '../users';
import { metaLanguages } from '../meta';

export const descriptions = booksSchema.table(
	'descriptions',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),

		description: text('name').notNull(),

		langId: uuid('lang_id')
			.notNull()
			.references(() => metaLanguages.id, { onDelete: 'restrict' }),

		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
	},
	(t) => [
		index('descriptions_book_id_idx').on(t.bookId),
		index('descriptions_lang_id_idx').on(t.langId),
	],
);

export const descriptionsRelations = relations(descriptions, ({ one }) => ({
	book: one(books, {
		fields: [descriptions.bookId],
		references: [books.id],
	}),

	language: one(metaLanguages, {
		fields: [descriptions.langId],
		references: [metaLanguages.id],
	}),

	createdBy: one(users, {
		fields: [descriptions.createdBy],
		references: [users.id],
	}),
}));
