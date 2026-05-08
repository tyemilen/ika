import { inArray, sql } from 'drizzle-orm';
import { chapters } from '~~/db';
import { UsersMeHistoryResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<UsersMeHistoryResponse> => {
	const { user } = await requireUserSession(event);

	const historyRaw = await event.context.db.query.readingHistory.findMany({
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
	const bookIds = historyRaw.map((h) => h.bookId);
	const allChapters = await event.context.db
		.select({
			id: chapters.id,
			bookId: chapters.bookId,
			langId: chapters.langId,
		})
		.from(chapters)
		.where(inArray(chapters.bookId, bookIds))
		.orderBy(chapters.number);

	return historyRaw.map((h) => {
		const bookChapters = allChapters.filter(
			(c) => c.bookId === h.bookId && c.langId === h.lastChapter.langId,
		);
		const lastChapterIndex = bookChapters.findIndex((c) => c.id === h.lastChapter.id);
		const totalChapters = bookChapters.length || 1;
		const finishedChaptersProgress = (lastChapterIndex / totalChapters) * 100;
		const totalPagesInChapter = h.lastChapter.pagesCount || 1;
		const currentPageProgress =
			(h.lastPage.number / totalPagesInChapter) * (100 / totalChapters);
		const progress = Math.min(Math.round(finishedChaptersProgress + currentPageProgress), 100);

		console.log(progress);
		return {
			book: {
				id: h.bookId,
				coverId: h.book.covers.find((c) => c.isPrimary)!.id,
				title: h.book.titles.find((t) => t.isPrimary)!.title,
			},
			chapter: {
				id: h.lastChapterId,
				name: h.lastChapter.name,
			},
			timeSpent: h.timeSpent,
			pageNumber: h.lastPage.number,
			progress,
		};
	});
});
