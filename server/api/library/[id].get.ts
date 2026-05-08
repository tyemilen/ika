import { LibraryShelfResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<LibraryShelfResponse> => {
	const id = getRouterParam(event, 'id');

	if (!id)
		throw createError({
			statusCode: 404,
		});

	const shelf = await event.context.db.query.shelves.findFirst({
		where: (shelves, { eq }) => eq(shelves.id, id),
		with: {
			user: true,
		},
	});

	if (!shelf)
		throw createError({
			statusCode: 404,
		});

	const shelfBooks = await event.context.db.query.shelfBooks.findMany({
		where: (shelfBooks, { eq }) => eq(shelfBooks.shelfId, id),
		with: {
			book: {
				with: {
					covers: true,
					titles: true,
				},
			},
		},
	});

	return {
		name: shelf.name,
		type: shelf.type,
		owner: {
			id: shelf.user.id,
			username: shelf.user.username,
		},
		books: shelfBooks.map((s) => ({
			id: s.book.id,
			slug: s.book.slug,
			cover: s.book.covers.find((c) => c.isPrimary)!.id,
			title: s.book.titles.find((c) => c.isPrimary)!.title,
		})),
	};
});
