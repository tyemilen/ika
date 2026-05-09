import { relations } from 'drizzle-orm';
import { index, integer, primaryKey, timestamp, uuid } from 'drizzle-orm/pg-core';

import { usersSchema } from './schema';
import { users } from './users';

import { books } from '../books';
import { pages } from '../chapters';

export const readingHistory = usersSchema.table(
	'reading_history',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, {
				onDelete: 'cascade',
			}),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, {
				onDelete: 'cascade',
			}),
		lastPageId: uuid('page_id')
			.notNull()
			.references(() => pages.id, {
				onDelete: 'cascade',
			}),
		timeSpent: integer('time_spent').notNull().default(0),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
		})
			.notNull()
			.defaultNow(),
	},
	(t) => [
		primaryKey({
			name: 'reading_history_user_book_pk',
			columns: [t.userId, t.bookId],
		}),
		index('reading_history_user_last_read_idx').on(t.userId, t.updatedAt.desc()),
		index('reading_history_last_read_book_idx').on(t.updatedAt.desc(), t.bookId),
		index('reading_history_book_last_read_idx').on(t.bookId, t.updatedAt.desc()),
	],
);

export const readingHistoryRelations = relations(readingHistory, ({ one }) => ({
	user: one(users, {
		fields: [readingHistory.userId],
		references: [users.id],
	}),

	book: one(books, {
		fields: [readingHistory.bookId],
		references: [books.id],
	}),

	lastPage: one(pages, {
		fields: [readingHistory.lastPageId],
		references: [pages.id],
	}),
}));
