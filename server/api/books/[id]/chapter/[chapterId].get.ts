import { eq, and, or, gt, asc, lt, desc } from 'drizzle-orm';
import { chapters, pages } from '~~/db';
import { BooksChapterResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BooksChapterResponse> => {
	if (!event.context.params) throw createError({ statusCode: 404 });

	const { id: bookId, chapterId } = event.context.params;

	if (!bookId || !chapterId)
		throw createError({
			statusCode: 404,
		});

	const chapterInfo = await event.context.db.query.chapters.findFirst({
		where: (chapters, { eq, and }) =>
			and(eq(chapters.id, chapterId), eq(chapters.bookId, bookId)),
		with: {
			book: {
				columns: {
					slug: true,
				},
				with: {
					titles: true,
				},
			},
		},
	});

	if (!chapterInfo)
		throw createError({
			statusCode: 404,
		});

	const [pagesList, prevChapter, nextChapter] = await Promise.all([
		event.context.db.select({ id: pages.id }).from(pages).where(eq(pages.chapterId, chapterId)),
		event.context.db.query.chapters.findFirst({
			where: and(
				eq(chapters.bookId, bookId),
				eq(chapters.langId, chapterInfo.langId),
				or(
					and(
						eq(chapters.volume, chapterInfo.volume),
						lt(chapters.number, chapterInfo.number),
					),
					lt(chapters.volume, chapterInfo.volume),
				),
			),
			orderBy: [desc(chapters.volume), desc(chapters.number)],
		}),
		event.context.db.query.chapters.findFirst({
			where: and(
				eq(chapters.bookId, bookId),
				eq(chapters.langId, chapterInfo.langId),
				or(
					and(
						eq(chapters.volume, chapterInfo.volume),
						gt(chapters.number, chapterInfo.number),
					),
					gt(chapters.volume, chapterInfo.volume),
				),
			),
			orderBy: [asc(chapters.volume), asc(chapters.number)],
		}),
	]);

	const response: BooksChapterResponse = {
		book: {
			slug: chapterInfo.book.slug,
			name: chapterInfo.book.titles.find((x) => x.isPrimary)?.title || 'Unknown',
		},
		chapter: {
			id: chapterInfo.id,
			volume: chapterInfo.volume,
			number: chapterInfo.number,
			name: chapterInfo.name,
		},
		pages: pagesList.map((x) => x.id),
	};

	if (prevChapter) {
		response.prev = {
			id: prevChapter.id,
			name: prevChapter.name,
			volume: prevChapter.volume,
			number: prevChapter.number,
		};
	}

	if (nextChapter) {
		response.next = {
			id: nextChapter.id,
			name: nextChapter.name,
			volume: nextChapter.volume,
			number: nextChapter.number,
		};
	}

	return response;
});
