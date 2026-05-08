import { relations } from 'drizzle-orm';
import { uuid, primaryKey, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';
import { usersSchema } from './schema';
import { books } from '../books';
import { shelves } from './shelves';

export const shelfBooks = usersSchema.table(
	'shelf_books',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		shelfId: uuid('shelf_id')
			.notNull()
			.references(() => shelves.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [primaryKey({ columns: [t.shelfId, t.userId, t.bookId] })],
);

export const bookLikesRelations = relations(shelfBooks, ({ one }) => ({
	user: one(users, { fields: [shelfBooks.userId], references: [users.id] }),
	book: one(books, { fields: [shelfBooks.bookId], references: [books.id] }),
	shelf: one(shelves, { fields: [shelfBooks.shelfId], references: [shelves.id] }),
}));
