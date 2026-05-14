import { genres, themes, titles } from '~~/db';
import { BaseBookResponse, BooksSearchPostBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseBookResponse[]> => {
	const body = await readValidatedBody(event, (body) =>
		BooksSearchPostBodySchema.safeParse(body),
	);

	if (body.error)
		throw createError({
			statusCode: 400,
		});

	const filters = body.data;
	const db = event.context.db;
	const results = await db.query.books.findMany({
		where: (books, { and, eq, ilike, exists, inArray }) => {
			const conditions = [];

			conditions.push(eq(books.status, 'published'));

			if (filters.publicationStatus) {
				conditions.push(eq(books.publicationStatus, filters.publicationStatus));
			}

			if (filters.publicationYear) {
				conditions.push(eq(books.publicationYear, filters.publicationYear));
			}

			if (filters.language) {
				conditions.push(eq(books.language, filters.language));
			}

			if (filters.title) {
				conditions.push(
					exists(
						db
							.select()
							.from(titles)
							.where(
								and(
									eq(titles.bookId, books.id),
									ilike(titles.title, `%${filters.title}%`),
								),
							),
					),
				);
			}

			if (filters.genres && filters.genres.length > 0) {
				conditions.push(
					exists(
						db
							.select()
							.from(genres)
							.where(
								and(
									eq(genres.bookId, books.id),
									inArray(genres.genreId, filters.genres),
								),
							),
					),
				);
			}

			if (filters.themes && filters.themes.length > 0) {
				conditions.push(
					exists(
						db
							.select()
							.from(themes)
							.where(
								and(
									eq(themes.bookId, books.id),
									inArray(themes.themeId, filters.themes),
								),
							),
					),
				);
			}

			return and(...conditions);
		},
		with: {
			covers: true,
			titles: true,
		},
	});

	const books = results.map((r) => mapBook(r));

	return books;
});
