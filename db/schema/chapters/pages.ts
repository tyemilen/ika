import { relations, sql } from 'drizzle-orm';
import { integer, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { chaptersSchema } from './schema';

import { chapters } from './chapters';

export const pages = chaptersSchema.table(
	'pages',
	{
		id: uuid('id')
			.defaultRandom()
			.primaryKey()
			.default(sql`uuidv7()`),
		chapterId: uuid('chapter_id')
			.notNull()
			.references(() => chapters.id, { onDelete: 'cascade' }),
		number: integer('number').notNull(),
	},
	(t) => [uniqueIndex('pages_chapter_number_unique_idx').on(t.chapterId, t.number)],
);

export const pagesRelations = relations(pages, ({ one }) => ({
	chapter: one(chapters, {
		fields: [pages.chapterId],
		references: [chapters.id],
	}),
}));
