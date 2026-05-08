import { relations } from 'drizzle-orm';
import { index, integer, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';

import { books } from './books';
import { metaArtists } from '../meta';

export const artists = booksSchema.table(
	'artists',
	{
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		artistId: uuid('artist_id')
			.notNull()
			.references(() => metaArtists.id, { onDelete: 'restrict' }),
	},
	(t) => [
		primaryKey({ columns: [t.bookId, t.artistId] }),
		index('artists_artist_id_idx').on(t.artistId),
	],
);

export const artistsRelations = relations(artists, ({ one }) => ({
	book: one(books, {
		fields: [artists.bookId],
		references: [books.id],
	}),

	artist: one(metaArtists, {
		fields: [artists.artistId],
		references: [metaArtists.id],
	}),
}));
