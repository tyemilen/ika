import { relations, sql } from 'drizzle-orm';
import { uuid, text, timestamp, index, integer, numeric, real } from 'drizzle-orm/pg-core';

import { booksSchema } from './schema';
import { descriptions } from './descriptions';
import { titles } from './titles';
import { genres } from './genres';
import { themes } from './themes';

import { users } from '../users';
import { metaLanguages } from '../meta';
import { covers } from './covers';
import { artists } from './artists';
import { authors } from './authors';

export const bookPublicationStatusEnum = booksSchema.enum('publication_status', [
	'ongoing',
	'completed',
	'paused',
	'cancelled',
]);
export type BookPublicationStatus = (typeof bookPublicationStatusEnum.enumValues)[number];

export const bookStatusEnum = booksSchema.enum('book_status', [
	'draft',
	'queue',
	'rejected',
	'published',
]);
export type BookStatus = (typeof bookStatusEnum.enumValues)[number];

export const books = booksSchema.table(
	'books',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),

		slug: text('slug').notNull().unique(),

		status: bookStatusEnum('status').notNull().default('draft'),
		publicationStatus: bookPublicationStatusEnum('publication_status').notNull(),

		language: uuid('language')
			.notNull()
			.references(() => metaLanguages.id, { onDelete: 'restrict' }),

		publicationYear: integer('publication_year').notNull(),

		likesCount: integer('likes_count').default(0).notNull(),

		averageRating: numeric('average_rating', { precision: 4, scale: 2, mode: 'number' })
			.default(0)
			.notNull(),
		totalRatings: integer('total_ratings').default(0).notNull(),

		createdBy: uuid('created_by').references(() => users.id, { onDelete: 'restrict' }),
		createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true })
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),

		rejectReason: text('reject_reason'),
		reviewedBy: uuid('reviewed_by').references(() => users.id, { onDelete: 'restrict' }),
		reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
	},
	(t) => [
		index('books_status_idx').on(t.status),
		index('books_created_by_idx').on(t.createdBy),
		index('books_created_at_idx').on(t.createdAt),
		index('books_updated_at_idx').on(t.updatedAt),
		index('books_rating_idx').on(t.averageRating),
		index('books_likes_idx').on(t.likesCount),
	],
);

export const booksRelations = relations(books, ({ one, many }) => ({
	createdBy: one(users, {
		fields: [books.createdBy],
		references: [users.id],
	}),

	reviewer: one(users, {
		fields: [books.reviewedBy],
		references: [users.id],
	}),

	language: one(metaLanguages, {
		fields: [books.language],
		references: [metaLanguages.id],
	}),

	descriptions: many(descriptions),
	titles: many(titles),
	genres: many(genres),
	themes: many(themes),
	covers: many(covers),
	artists: many(artists),
	authors: many(authors),
}));
