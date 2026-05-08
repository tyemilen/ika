import { eq, sql } from 'drizzle-orm';
import {
	artists,
	authors,
	books,
	draftArtists,
	draftAuthors,
	metaArtists,
	metaAuthors,
} from '~~/db';
import { BaseSuccessResponse } from '~~/shared/schemas';
import { BOOKS_INDEX, BookDocument } from '~~/shared/meilisearch';
import slug from 'slug';
import { nanoid } from 'nanoid';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);
	const bookId = event.context.params?.id;

	console.log(user);
	if (!['admin', 'moderator'].includes(user.role))
		throw createError({
			status: 403,
		});

	if (!bookId)
		throw createError({
			statusCode: 404,
		});

	const result = await event.context.db.transaction(async (tx) => {
		const [book] = await tx
			.update(books)
			.set({ status: 'published' })
			.where(eq(books.id, bookId))
			.returning({ id: books.id });

		if (!book) throw new Error('bruh');

		const bookAuthors = await tx
			.select({ name: draftAuthors.name })
			.from(draftAuthors)
			.where(eq(draftAuthors.bookId, bookId));

		if (bookAuthors.length > 0) {
			const insertedMeta = await tx
				.insert(metaAuthors)
				.values(
					bookAuthors.map((x) => ({
						slug: slug(`${x.name}-${nanoid(8)}`),
						name: x.name,
					})),
				)
				.onConflictDoUpdate({
					target: metaAuthors.name,
					set: { name: sql`EXCLUDED.name` },
				})
				.returning({ id: metaAuthors.id });

			await tx.insert(authors).values(
				insertedMeta.map((meta) => ({
					bookId: bookId,
					authorId: meta.id,
				})),
			);

			await tx.delete(draftAuthors).where(eq(draftAuthors.bookId, bookId));
		}

		const bookArtists = await tx
			.select({ name: draftArtists.name })
			.from(draftArtists)
			.where(eq(draftArtists.bookId, bookId));

		if (bookArtists.length > 0) {
			const insertedMeta = await tx
				.insert(metaArtists)
				.values(
					bookArtists.map((x) => ({
						slug: slug(`${x.name}-${nanoid(8)}`),
						name: x.name,
					})),
				)
				.onConflictDoUpdate({
					target: metaArtists.name,
					set: { name: sql`EXCLUDED.name` },
				})
				.returning({ id: metaArtists.id });

			await tx.insert(artists).values(
				insertedMeta.map((meta) => ({
					bookId: bookId,
					artistId: meta.id,
				})),
			);

			await tx.delete(draftArtists).where(eq(draftArtists.bookId, bookId));
		}
		return book.id;
	});

	if (!result)
		throw createError({
			statusCode: 404,
			statusMessage: 'Book not found',
		});

	const book = await event.context.db.query.books.findFirst({
		where: (books, { eq }) => eq(books.id, bookId),
		with: {
			titles: true,
			covers: true,
			genres: {
				with: {
					genre: true,
				},
			},
			themes: {
				with: {
					theme: true,
				},
			},
		},
	});

	if (!book)
		throw createError({
			statusCode: 404,
			statusMessage: 'how',
		});

	const index = await event.context.meilisearch.index(BOOKS_INDEX);

	const bookDoc: BookDocument = {
		primaryKey: book.id,
		slug: book.slug,
		coverId: book.covers.find((c) => c.isPrimary)!.id,
		title: book.titles.find((t) => t.isPrimary)!.title,
		genres: book.genres.map((g) => g.genre.id),
		themes: book.themes.map((g) => g.theme.id),
	};

	console.log('adding', bookDoc);
	await index.addDocuments([bookDoc]).catch((err) => console.log(err));

	return { success: true };
});
