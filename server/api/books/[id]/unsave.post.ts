import { and, eq, sql } from 'drizzle-orm';

import { books, shelfBooks, shelves } from '~~/db';
import { BaseSuccessResponse, BooksSavePatchBodySchema } from '~~/shared/schemas';
export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const bookId = getRouterParam(event, 'id');

	if (!bookId)
		throw createError({
			statusCode: 400,
		});

	const body = await readValidatedBody(event, (body) => BooksSavePatchBodySchema.safeParse(body));
	if (body.error)
		throw createError({
			statusCode: 400,
		});

	const { user } = await requireUserSession(event);

	const shelf = await event.context.db.query.shelves.findFirst({
		where: (shelves, { eq, and }) =>
			and(eq(shelves.id, body.data.shelfId), eq(shelves.userId, user.id)),
	});

	if (!shelf)
		throw createError({
			statusCode: 404,
		});

	const txResult = await event.context.db.transaction(async (tx) => {
		await tx
			.delete(shelfBooks)
			.where(
				and(
					eq(shelfBooks.bookId, bookId),
					eq(shelfBooks.shelfId, shelf.id),
					eq(shelfBooks.userId, user.id),
				),
			);

		if (shelf.type === 'liked') {
			await tx
				.update(books)
				.set({
					likesCount: sql`${books.likesCount} - 1`,
				})
				.where(eq(books.id, bookId));
		}

		return true;
	});

	if (!txResult)
		throw createError({
			statusCode: 500,
		});

	return { success: true };
});
