import { relations } from 'drizzle-orm';
import { index, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { books } from './books';
import { metaGenres } from '../meta';

export const genres = booksSchema.table(
	'genres',
	{
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		genreId: uuid('genre_id')
			.notNull()
			.references(() => metaGenres.id, { onDelete: 'restrict' }),
	},
	(t) => [
		primaryKey({ columns: [t.bookId, t.genreId] }),
		index('genres_genre_id_idx').on(t.genreId),
	],
);

export const genresRelations = relations(genres, ({ one }) => ({
	book: one(books, {
		fields: [genres.bookId],
		references: [books.id],
	}),

	genre: one(metaGenres, {
		fields: [genres.genreId],
		references: [metaGenres.id],
	}),
}));
