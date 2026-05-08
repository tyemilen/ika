import { and, eq } from 'drizzle-orm';
import { books } from '~~/db';
import { BaseSuccessResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);
	const bookId = event.context.params?.id;

	if (!bookId)
		throw createError({
			statusCode: 404,
		});

	const result = await event.context.db
		.update(books)
		.set({ status: 'queue' })
		.where(and(eq(books.createdBy, user.id), eq(books.id, bookId)))
		.returning({ id: books.id });

	if (result.length === 0)
		throw createError({
			statusCode: 404,
			statusMessage: 'Book not found',
		});

	return { success: true };
});
