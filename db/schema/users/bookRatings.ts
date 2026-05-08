import { relations } from 'drizzle-orm';
import { uuid, primaryKey, text, integer } from 'drizzle-orm/pg-core';

import { users } from './users';
import { usersSchema } from './schema';
import { books } from '../books';

export const bookRatings = usersSchema.table(
	'book_ratings',
	{
		userId: uuid('user_id')
			.notNull()
			.unique()
			.references(() => users.id, { onDelete: 'cascade' }),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		rating: integer('rating').notNull(), // min: 1 max: 10
		review: text('review').default(null),
	},
	(t) => [primaryKey({ columns: [t.userId, t.bookId] })],
);

export const bookRatingsRelations = relations(bookRatings, ({ one }) => ({
	user: one(users, { fields: [bookRatings.userId], references: [users.id] }),
	book: one(books, { fields: [bookRatings.bookId], references: [books.id] }),
}));
