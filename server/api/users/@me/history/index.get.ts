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
				columns: {
					id: true,
				},
				with: {
					titles: true,
					covers: true,
				},
			},
			lastPage: {
				columns: {
					number: true,
				},
				with: {
					chapter: {
						columns: {
							id: true,
							name: true,
							number: true,
							langId: true,
							pagesCount: true,
							bookId: true,
						},
					},
				},
			},
		},
	});

	if (historyRaw.length === 0) {
		return [];
	}

	const bookIds = [...new Set(historyRaw.map((h) => h.bookId))];

	const allChapters = await event.context.db
		.select({
			id: chapters.id,
			bookId: chapters.bookId,
			langId: chapters.langId,
		})
		.from(chapters)
		.where(inArray(chapters.bookId, bookIds))
		.orderBy(chapters.number);

	// Group chapters by bookId + langId
	const chaptersMap = new Map<
		string,
		{
			total: number;
			indexMap: Map<string, number>;
		}
	>();

	const grouped = new Map<
		string,
		{
			id: string;
		}[]
	>();

	for (const chapter of allChapters) {
		const key = `${chapter.bookId}:${chapter.langId}`;

		if (!grouped.has(key)) {
			grouped.set(key, []);
		}

		grouped.get(key)!.push(chapter);
	}

	for (const [key, chaptersList] of grouped.entries()) {
		chaptersMap.set(key, {
			total: chaptersList.length,
			indexMap: new Map(chaptersList.map((c, index) => [c.id, index])),
		});
	}

	return historyRaw.map((h) => {
		const chapter = h.lastPage.chapter;

		const key = `${h.bookId}:${chapter.langId}`;
		const meta = chaptersMap.get(key);

		const totalChapters = meta?.total ?? 1;
		const lastChapterIndex = meta?.indexMap.get(chapter.id) ?? 0;

		const totalPagesInChapter = chapter.pagesCount || 1;

		const chapterProgress = Math.min(h.lastPage.number / totalPagesInChapter, 1);

		const progress = Math.min(
			Math.round(((lastChapterIndex + chapterProgress) / totalChapters) * 100),
			100,
		);

		const primaryCover = h.book.covers.find((c) => c.isPrimary);
		const primaryTitle = h.book.titles.find((t) => t.isPrimary);

		if (!primaryCover || !primaryTitle) {
			throw createError({
				statusCode: 500,
				statusMessage: 'Invalid metadata',
			});
		}

		return {
			book: {
				id: h.bookId,
				coverId: primaryCover.id,
				title: primaryTitle.title,
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
