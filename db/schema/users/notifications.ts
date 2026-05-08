import { relations, sql } from 'drizzle-orm';
import { boolean, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { usersSchema } from './schema';
import { users } from './users';

export const notifications = usersSchema.table('notifications', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),

	type: text('type').notNull(),

	data: jsonb('data').notNull(),
	isRead: boolean('is_read').notNull().default(false),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
	user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
