import { relations } from 'drizzle-orm';
import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { books } from './books';
import { metaThemes } from '../meta';

export const themes = booksSchema.table(
	'themes',
	{
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		themeId: uuid('theme_id')
			.notNull()
			.references(() => metaThemes.id, { onDelete: 'restrict' }),
	},
	(t) => [
		primaryKey({ columns: [t.bookId, t.themeId] }),
		index('themes_theme_id_idx').on(t.themeId),
	],
);

export const themesRelations = relations(themes, ({ one }) => ({
	book: one(books, {
		fields: [themes.bookId],
		references: [books.id],
	}),

	theme: one(metaThemes, {
		fields: [themes.themeId],
		references: [metaThemes.id],
	}),
}));
