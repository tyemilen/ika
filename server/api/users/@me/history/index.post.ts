import { sql } from 'drizzle-orm';
import { readingHistory } from '~~/db';
import { BaseSuccessResponse, MyHistoryPostBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);

	const { data, success } = await readValidatedBody(event, (body) =>
		MyHistoryPostBodySchema.safeParse(body),
	);

	if (!success)
		throw createError({
			statusCode: 401,
		});
	const existing = await event.context.db.query.readingHistory.findFirst({
		where: (rh, { and, eq }) => and(eq(rh.userId, user.id), eq(rh.bookId, data.bookId)),
	});

	if (existing) {
		const now = new Date();
		const sinceLastUpdate = Math.floor((now.getTime() - existing.updatedAt.getTime()) / 1000);

		if (data.timeSpent > sinceLastUpdate + 30)
			throw createError({
				statusCode: 400,
			});
	}

	await event.context.db
		.insert(readingHistory)
		.values({
			userId: user.id,
			bookId: data.bookId,
			lastPageId: data.pageId,
			timeSpent: data.timeSpent,
			updatedAt: new Date(),
		})
		.onConflictDoUpdate({
			target: [readingHistory.userId, readingHistory.bookId],
			set: {
				lastPageId: data.pageId,
				timeSpent: sql`${readingHistory.timeSpent} + ${data.timeSpent}`,
				updatedAt: new Date(),
			},
		});

	return { success: true };
});
