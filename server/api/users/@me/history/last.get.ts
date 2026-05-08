import { eq } from 'drizzle-orm';
import { chapters } from '~~/db';
import { UsersMeHistoryEntryResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<UsersMeHistoryEntryResponse> => {
	const { user } = await requireUserSession(event);

	const historyRaw = await event.context.db.query.readingHistory.findFirst({
		where: (rh, { eq }) => eq(rh.userId, user.id),
		orderBy: (rh, { desc }) => [desc(rh.updatedAt)],
		with: {
			book: {
				columns: {
					id: true,
				},
				with: {
					titles: true,
					covers: true,
				},
			},
			lastChapter: {
				columns: {
					id: true,
					name: true,
					number: true,
					langId: true,
					pagesCount: true,
				},
			},
			lastPage: {
				columns: {
					number: true,
				},
			},
		},
	});

	if (!historyRaw)
		throw createError({
			statusCode: 404,
		});

	const totalPagesInChapter = historyRaw.lastChapter.pagesCount || 1;
	const currentPageProgress = (historyRaw.lastPage.number / totalPagesInChapter) * 100;
	const progress = Math.min(Math.round(currentPageProgress), 100);

	return {
		book: {
			id: historyRaw.bookId,
			coverId: historyRaw.book.covers.find((c) => c.isPrimary)!.id,
			title: historyRaw.book.titles.find((t) => t.isPrimary)!.title,
		},
		chapter: {
			id: historyRaw.lastChapterId,
			name: historyRaw.lastChapter.name,
		},
		timeSpent: -1,
		pageNumber: historyRaw.lastPage.number,
		progress,
	};
});
