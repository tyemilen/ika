import { relations, sql } from 'drizzle-orm';
import { boolean, index, integer, numeric, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { chaptersSchema } from './schema';

import { books } from '../books';
import { users } from '../users';
import { metaLanguages } from '../meta';

export const chapters = chaptersSchema.table(
	'chapters',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),

		isOneshot: boolean('is_oneshot').notNull().default(false),

		name: text('name').notNull(),

		volume: numeric('volume').notNull(),
		number: numeric('number').notNull(),

		pagesCount: integer('pages_count').notNull(),

		langId: uuid('lang_id')
			.notNull()
			.references(() => metaLanguages.id, { onDelete: 'restrict' }),

		createdBy: uuid('created_by')
			.notNull()
			.references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		index('chapters_lang_id_idx').on(t.langId),
		index('chapters_created_at_idx').on(t.createdAt),
		index('chapters_book_id_created_at_idx').on(t.bookId, t.createdAt),
	],
);

export const chaptersRelations = relations(chapters, ({ one }) => ({
	book: one(books, {
		fields: [chapters.bookId],
		references: [books.id],
	}),

	language: one(metaLanguages, {
		fields: [chapters.langId],
		references: [metaLanguages.id],
	}),

	createdBy: one(users, {
		fields: [chapters.createdBy],
		references: [users.id],
	}),
}));
