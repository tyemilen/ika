import { relations, sql } from 'drizzle-orm';
import { boolean, index, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';
import { usersSchema } from './schema';

export const shelfType = usersSchema.enum('shelf_type', ['liked', 'user', 'generated']);

export const shelves = usersSchema.table(
	'shelves',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		name: varchar('name', { length: 128 }).notNull(),
		type: shelfType('type').default('user').notNull(),
		isPrivate: boolean('is_private').default(false).notNull(),
	},
	(t) => [
		uniqueIndex('shelves_user_id_liked_unique_idx')
			.on(t.userId)
			.where(sql`${t.type} = 'liked'`),
		index('shelves_user_id_idx').on(t.userId),
	],
);

export const librariesRelations = relations(shelves, ({ one }) => ({
	user: one(users, { fields: [shelves.userId], references: [users.id] }),
}));
