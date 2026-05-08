import { relations, sql } from 'drizzle-orm';
import { uuid, text, timestamp, varchar } from 'drizzle-orm/pg-core';

import { profiles } from './profiles';
import { usersSchema } from './schema';

export const userRoleEnum = usersSchema.enum('user_role', ['admin', 'moderator', 'user']);

export type UserRole = (typeof userRoleEnum.enumValues)[number];

export const users = usersSchema.table('users', {
	id: uuid('id')
		.defaultRandom()
		.primaryKey()
		.default(sql`uuidv7()`),
	username: varchar('username', { length: 32 }).notNull().unique(),
	email: text('email').notNull().unique(),
	password: text('password').notNull(),
	role: userRoleEnum('role').notNull().default('user'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one }) => ({
	profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
}));
