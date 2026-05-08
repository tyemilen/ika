import { BaseShelfResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseShelfResponse[]> => {
	const { user } = await requireUserSession(event);

	const shelves = await event.context.db.query.shelves.findMany({
		where: (shelves, { eq }) => eq(shelves.userId, user.id),
	});

	return shelves;
});
