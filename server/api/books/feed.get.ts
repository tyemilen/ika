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
			cover: `${x.book.id}/${x.book.covers[0]!.id}`,
			createdAt: x.createdAt.getTime(),
		})),
	};
});
