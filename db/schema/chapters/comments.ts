import { relations, sql } from 'drizzle-orm';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { chaptersSchema } from './schema';
import { users } from '../users';
import { pages } from './pages';

import constants from '../../../shared/constants';

export const pageComments = chaptersSchema.table('comments', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	pageId: uuid('page_id')
		.notNull()
		.references(() => pages.id, { onDelete: 'cascade' }),
	userId: uuid('user_id').references(() => users.id, { onDelete: 'restrict' }),
	text: varchar('text', { length: constants.MAX_COMMENT_LENGTH }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true })
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
});

export const pageCommentsRelations = relations(pageComments, ({ one }) => ({
	page: one(pages, {
		fields: [pageComments.pageId],
		references: [pages.id],
	}),
	user: one(users, {
		fields: [pageComments.userId],
		references: [users.id],
	}),
}));
