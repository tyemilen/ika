import { relations, sql } from 'drizzle-orm';
import { index, integer, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { usersSchema } from './schema';
import { users } from './users';
import { books } from '../books';
import { chapters, pages } from '../chapters';

export const readingHistory = usersSchema.table(
	'reading_history',
	{
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		bookId: uuid('book_id')
			.notNull()
			.references(() => books.id, { onDelete: 'cascade' }),
		lastChapterId: uuid('chapter_id')
			.notNull()
			.references(() => chapters.id, { onDelete: 'cascade' }),
		lastPageId: uuid('page_id')
			.notNull()
			.references(() => pages.id, { onDelete: 'cascade' }),
		timeSpent: integer('time_spent').default(0).notNull(), // seconds
		updatedAt: timestamp('updated_at').defaultNow().notNull(),
	},
	(t) => [
		index('reading_history_user_updated_idx').on(t.userId, t.updatedAt.desc()),
		uniqueIndex('reading_history_user_book_idx').on(t.userId, t.bookId),
	],
);

export const readingHistoryRelations = relations(readingHistory, ({ one }) => ({
	user: one(users, { fields: [readingHistory.userId], references: [users.id] }),
	book: one(books, { fields: [readingHistory.bookId], references: [books.id] }),
	lastChapter: one(chapters, {
		fields: [readingHistory.lastChapterId],
		references: [chapters.id],
	}),
	lastPage: one(pages, { fields: [readingHistory.lastPageId], references: [pages.id] }),
}));
