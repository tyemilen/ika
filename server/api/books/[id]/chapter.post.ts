import { chapters, pages } from '~~/db';
import { BaseSuccessResponse, BooksChapterPostBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const bookId = event.context.params?.id;

	if (!bookId)
		throw createError({
			statusCode: 401,
		});

	const { user } = await requireUserSession(event);
	const formData = await readFormData(event);
	const rawData = {
		number: Number(formData.get('number')),
		volume: Number(formData.get('volume')),
		name: formData.get('name'),
		language: formData.get('language'),
		pages: formData.getAll('pages'),
	};
	const body = BooksChapterPostBodySchema.safeParse(rawData);
	if (!body.success)
		throw createError({
			statusCode: 400,
			message: body.error.message,
		});

	const book = await event.context.db.query.books.findFirst({
		where: (books, { eq }) => eq(books.id, bookId),
	});

	if (!book)
		throw createError({
			statusCode: 404,
		});

	const chapterData = body.data;
	const result = await event.context.db.transaction(async (tx) => {
		const [chapter] = await tx
			.insert(chapters)
			.values({
				bookId: book.id,
				number: chapterData.number.toString(),
				volume: chapterData.volume.toString(),
				name: chapterData.name,
				langId: chapterData.language,
				createdBy: user.id,
				pagesCount: chapterData.pages.length,
			})
			.returning({ id: chapters.id });

		if (!chapter) throw new Error('failed to insert chapter');

		const pageEntries = chapterData.pages.map((_, index) => ({
			chapterId: chapter.id,
			number: index + 1,
		}));

		const insertedPages = await tx
			.insert(pages)
			.values(pageEntries)
			.returning({ id: pages.id });

		return { chapter, insertedPages };
	});

	const uploadPromises = result.insertedPages.map(async (dbPage, index) => {
		const file = chapterData.pages[index];
		if (!file) return;

		const key = `chapter-pages/${result.chapter.id}/${dbPage.id}`;

		await event.context.s3.putAnyObject(key, Buffer.from(await file.arrayBuffer()), file.type);
	});

	await Promise.all(uploadPromises);

	return { success: true };
});
