import { desc, eq, inArray } from 'drizzle-orm';
import { chapters } from '~~/db';
import { UsersMeHistoryResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<UsersMeHistoryResponse> => {
	const { user } = await requireUserSession(event);

	const historyRaw = await event.context.db.query.readingHistory.findMany({
		where: (rh, { eq }) => eq(rh.userId, user.id),
		orderBy: (rh, { desc }) => [desc(rh.updatedAt)],
		with: {
			book: {
				columns: { id: true },
				with: { titles: true, covers: true },
			},
			lastPage: {
				columns: { number: true },
				with: { chapter: true },
			},
		},
	});

	if (!historyRaw.length) return [];

	const bookIds = [...new Set(historyRaw.map((h) => h.bookId))];

	const allChapters = await event.context.db
		.select({ id: chapters.id, bookId: chapters.bookId, langId: chapters.langId })
		.from(chapters)
		.where(inArray(chapters.bookId, bookIds))
		.orderBy(chapters.number);

	const chaptersMap = new Map<string, { id: string }[]>();
	for (const c of allChapters) {
		const key = `${c.bookId}:${c.langId}`;
		if (!chaptersMap.has(key)) chaptersMap.set(key, []);
		chaptersMap.get(key)!.push(c);
	}

	return historyRaw.map((h) => {
		const chapter = h.lastPage.chapter;
		const key = `${h.bookId}:${chapter.langId}`;
		const bookChapters = chaptersMap.get(key) || [];

		const totalChapters = bookChapters.length || 1;
		const lastChapterIndex = bookChapters.findIndex((c) => c.id === chapter.id);
		const safeChapterIndex = lastChapterIndex === -1 ? 0 : lastChapterIndex;

		const totalPagesInChapter = chapter.pagesCount || 1;
		const chapterProgress = h.lastPage.number / totalPagesInChapter;

		const progress = Math.min(
			Math.round(((safeChapterIndex + chapterProgress) / totalChapters) * 100),
			100,
		);

		const primaryCover = h.book.covers.find((c) => c.isPrimary) || h.book.covers[0];
		const primaryTitle = h.book.titles.find((t) => t.isPrimary) || h.book.titles[0];

		return {
			book: {
				id: h.bookId,
				coverId: primaryCover?.id ?? 'unknown',
				title: primaryTitle?.title ?? 'unknown',
			},
			chapter: {
				id: chapter.id,
				name: chapter.name,
			},
			timeSpent: h.timeSpent,
			pageNumber: h.lastPage.number,
			progress,
		};
	});
});
