import { relations, sql } from 'drizzle-orm';
import { uuid, text, varchar } from 'drizzle-orm/pg-core';

import { users } from './users';
import { usersSchema } from './schema';

export const profiles = usersSchema.table('profiles', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	userId: uuid('user_id')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	display_name: varchar('display_name', { length: 32 }).notNull(),
	bio: text('bio'),
});

export const profilesRelations = relations(profiles, ({ one }) => ({
	user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));
