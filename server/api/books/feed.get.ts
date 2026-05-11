import { desc, gte, sql } from 'drizzle-orm';
import { readingHistory } from '~~/db';
import { BooksFeedResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BooksFeedResponse> => {
	const freshRaw = await event.context.db.query.books.findMany({
		where: (books, { eq }) => eq(books.status, 'published'),
		orderBy: (books, { desc }) => [desc(books.updatedAt)],
		limit: 6,
		with: {
			language: {
				columns: {
					code: true,
				},
			},
			covers: true,
			titles: {
				columns: {
					title: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
			descriptions: {
				columns: {
					description: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
			themes: {
				with: {
					theme: {
						columns: {
							name: true,
						},
					},
				},
			},
			genres: {
				with: {
					genre: {
						columns: {
							name: true,
						},
					},
				},
			},
		},
	});

	const fresh = freshRaw.map((b) => ({
		id: b.id,
		slug: b.slug,
		status: b.status,
		language: b.language.code,
		publicationStatus: b.publicationStatus,
		publicationYear: b.publicationYear,
		covers: b.covers.map((c) => ({
			id: c.id,
			isPrimary: c.isPrimary,
		})),
		titles: b.titles.map((t) => ({
			language: t.language.code,
			content: t.title,
		})),
		descriptions: b.descriptions.map((t) => ({
			language: t.language.code,
			content: t.description,
		})),
		genres: b.genres.map((g) => (g.genre as { name: string }).name),
		themes: b.themes.map((t) => (t.theme as { name: string }).name),
		updatedAt: b.updatedAt,
	}));

	const chapters = await event.context.db.query.chapters.findMany({
		orderBy: (chapters, { desc }) => [desc(chapters.createdAt)],

		limit: 20,
		with: {
			language: true,
			createdBy: true,
			book: {
				with: {
					covers: true,
				},
			},
		},
	});

	//!todo move all stats to separate table
	const trending = await event.context.db
		.select({
			bookId: readingHistory.bookId,
			score: sql<number>`CAST(count(*) /  pow((extract(epoch from (now() - max(${readingHistory.updatedAt}))) / 3600) + 2, 1.5) as float)`.as(
				'score',
			),
		})
		.from(readingHistory)
		.where(gte(readingHistory.updatedAt, new Date(Date.now() - 24 * 60 * 60 * 1000)))
		.groupBy(readingHistory.bookId)
		.orderBy(desc(sql`score`))
		.limit(10);
	const trendingBooksRaw = await event.context.db.query.books.findMany({
		where: (books, { inArray, and, eq }) =>
			and(
				inArray(
					books.id,
					trending.map((x) => x.bookId),
				),
				eq(books.status, 'published'),
			),
		columns: {
			id: true,
			slug: true,
		},
		with: {
			covers: true,
			titles: {
				columns: {
					title: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
			descriptions: {
				columns: {
					description: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
		},
	});
	const trendingBooks: BooksFeedResponse['trending'] = trendingBooksRaw
		.map((b) => {
			const data = trending.find((t) => t.bookId === b.id);
			return {
				id: b.id,
				slug: b.slug,
				covers: b.covers.map((c) => ({
					id: c.id,
					isPrimary: c.isPrimary,
				})),
				titles: b.titles.map((t) => ({
					language: t.language.code,
					content: t.title,
				})),
				descriptions: b.descriptions.map((t) => ({
					language: t.language.code,
					content: t.description,
				})),
				score: data?.score || 0,
			};
		})
		.sort((a, b) => b.score - a.score);

	console.log(fresh);

	return {
		fresh,
		chapters: chapters.map((x) => ({
			id: x.id,
			name: x.name,
			language: x.language.code,
			number: Number(x.number),
			volume: Number(x.volume),
			author: {
				id: x.createdBy.id,
				username: x.createdBy.username,
			},
			bookId: x.book.id,
			coverId: x.book.covers.find((c) => c.isPrimary)!.id,
			createdAt: x.createdAt.getTime(),
		})),
		trending: trendingBooks,
	};
});
