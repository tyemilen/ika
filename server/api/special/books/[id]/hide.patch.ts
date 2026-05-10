import { eq } from 'drizzle-orm';
import { books } from '~~/db';
import { BaseSuccessResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);

	if (!['admin', 'moderator'].includes(user.role))
		throw createError({
			status: 403,
		});

	const bookId = event.context.params?.id;
	if (!bookId)
		throw createError({
			statusCode: 404,
		});

	await event.context.db.update(books).set({ status: 'hidden' }).where(eq(books.id, bookId));
	return { success: true };
});
