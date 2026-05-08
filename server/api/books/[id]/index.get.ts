import { eq, exists } from 'drizzle-orm';
import { shelves } from '~~/db';
import { BookGetResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BookGetResponse> => {
	const bookSlug = event.context.params?.id;

	if (!bookSlug)
		throw createError({
			statusCode: 404,
		});

	const book = await event.context.db.query.books.findFirst({
		where: (books, { eq }) => eq(books.slug, bookSlug),
		with: {
			language: {
				columns: {
					code: true,
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
			authors: {
				with: {
					author: true,
				},
			},
			artists: {
				with: {
					artist: true,
				},
			},
		},
	});

	if (!book)
		throw createError({
			statusCode: 404,
		});

	const { user } = await getUserSession(event);

	let hasLiked = false;

	if (user) {
		hasLiked = await event.context.db.query.shelfBooks
			.findFirst({
				where: (shelfBooks, { eq, and }) =>
					and(
						eq(shelfBooks.bookId, book.id),
						eq(shelfBooks.userId, user.id),
						exists(
							event.context.db
								.select()
								.from(shelves)
								.where(
									and(
										eq(shelves.id, shelfBooks.shelfId),
										eq(shelves.type, 'liked'),
									),
								),
						),
					),
			})
			.then((r) => !!r);
	}

	const chapters = await event.context.db.query.chapters.findMany({
		where: (chapters, { eq }) => eq(chapters.bookId, book.id),
		with: {
			createdBy: {
				columns: {
					id: true,
					username: true,
				},
			},
			language: {
				columns: {
					code: true,
				},
			},
		},
	});

	return {
		id: book.id,
		slug: book.slug,
		status: book.status,
		language: book.language.code,
		publicationStatus: book.publicationStatus,
		publicationYear: book.publicationYear,

		rating: book.averageRating,
		likes: book.likesCount,

		descriptions: book.descriptions.map((d) => ({
			language: d.language.code,
			content: d.description,
		})),
		covers: book.covers.map((c) => ({
			id: c.id,
			isPrimary: c.isPrimary,
		})),
		titles: book.titles.map((t) => ({
			language: t.language.code,
			content: t.title,
		})),
		// any bc table name collision and drizzle breaks
		genres: book.genres.map((g) => (g.genre as any).name),
		themes: book.themes.map((t) => (t.theme as any).name),
		authors: book.authors.map((a) => (a.author as any).name),
		artists: book.artists.map((a) => (a.artist as any).name),

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
		})),

		liked: !!hasLiked,
	};
});
