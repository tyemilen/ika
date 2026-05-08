import slug from 'slug';
import { nanoid } from 'nanoid';

import {
	artists,
	authors,
	books,
	covers,
	descriptions,
	draftArtists,
	draftAuthors,
	genres,
	themes,
	titles,
} from '~~/db';
import { BooksPostBodySchema, BooksPostResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BooksPostResponse> => {
	const { user } = await requireUserSession(event);
	const formData = await readFormData(event);
	const formEntries = Object.fromEntries(formData.entries());
	const body = BooksPostBodySchema.safeParse(formEntries);

	if (!body.success)
		throw createError({
			statusCode: 400,
			message: body.error.message,
		});

	const draft = body.data;

	if (!draft.artistsIds.length && !draft.artistsNames.length)
		throw createError({
			statusCode: 400,
			message: 'At least 1 artist is required',
		});
	if (!draft.authorsIds.length && !draft.authorsNames.length)
		throw createError({
			statusCode: 400,
			message: 'At least 1 author is required',
		});

	const result = await event.context.db.transaction(async (tx) => {
		const [book] = await tx
			.insert(books)
			.values({
				slug: slug(`${draft.title}-${nanoid(8)}`),
				language: draft.language,
				publicationYear: draft.publicationYear,
				publicationStatus: draft.publicationStatus,
				status: 'draft',
				createdBy: user.id,
			})
			.returning({ id: books.id });

		if (!book) throw new Error('insert failed');

		const bookId = book.id;

		const genresIds = [...new Set(draft.genres)];
		const themesIds = [...new Set(draft.themes)];

		await tx.insert(genres).values(genresIds.map((g) => ({ bookId, genreId: g })));

		if (draft.themes.length)
			await tx.insert(themes).values(themesIds.map((t) => ({ bookId, themeId: t })));

		const authorIds = [...new Set(draft.authorsIds)];
		const artistIds = [...new Set(draft.artistsIds)];

		if (authorIds.length) {
			await tx.insert(authors).values(authorIds.map((authorId) => ({ bookId, authorId })));
		}

		if (artistIds.length) {
			await tx.insert(artists).values(artistIds.map((artistId) => ({ bookId, artistId })));
		}

		if (draft.authorsNames.length) {
			const cleanAuthorNames = draft.authorsNames.map((x) => x.trim()).filter(Boolean);

			await tx
				.insert(draftAuthors)
				.values([...new Set(cleanAuthorNames)].map((name) => ({ bookId, name })));
		}

		if (draft.artistsNames.length) {
			const cleanArtistsNames = draft.artistsNames.map((x) => x.trim()).filter(Boolean);

			await tx
				.insert(draftArtists)
				.values([...new Set(cleanArtistsNames)].map((name) => ({ bookId, name })));
		}

		if (draft.descriptions?.length) {
			await tx.insert(descriptions).values(
				draft.descriptions.map((t) => ({
					bookId,
					langId: t.language,
					description: t.content,
					createdBy: user.id,
				})),
			);
		}

		await tx.insert(titles).values([
			{
				bookId,
				langId: draft.titleLang,
				title: draft.title,
				isPrimary: true,
				createdBy: user.id,
			},
			...draft.titles.map((t) => ({
				bookId,
				langId: t.language,
				title: t.content,
				createdBy: user.id,
			})),
		]);

		const [cover] = await tx
			.insert(covers)
			.values({
				bookId,
				isPrimary: true,
			})
			.returning({ id: covers.id });

		if (!cover) throw new Error('cover insert failed');

		return { bookId, coverId: cover.id };
	});

	if (!result)
		throw createError({
			statusCode: 401,
		});

	const ret = await event.context.s3.putAnyObject(
		`book-covers/${result.bookId}/${result.coverId}`,
		draft.cover.stream(),
		draft.cover.type,
	);

	if (!ret.ok)
		throw createError({
			statusCode: 401,
		});

	return {
		id: result.bookId,
	};
});
