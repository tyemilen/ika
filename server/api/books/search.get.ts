import { BOOKS_INDEX, BookDocument } from '~~/shared/meilisearch';

export default defineEventHandler(async (event): Promise<BookDocument[]> => {
	const query = getQuery(event);

	if (!query.q) return [];

	const index = await event.context.meilisearch.index(BOOKS_INDEX);

	return (await index.search<BookDocument>(query.q as string)).hits;
});
