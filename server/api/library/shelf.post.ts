import { shelves } from '~~/db';
import { BaseSuccessResponse, LibraryShelfPostBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);
	const formData = await readFormData(event);
	const formEntries = Object.fromEntries(formData.entries());
	const body = LibraryShelfPostBodySchema.safeParse(formEntries);

	if (!body.success)
		throw createError({
			statusCode: 400,
			message: body.error.message,
		});

	const [shelf] = await event.context.db
		.insert(shelves)
		.values({
			userId: user.id,
			name: body.data.name,
		})
		.returning({ id: shelves.id });

	if (!shelf)
		throw createError({
			statusCode: 401,
		});

	if (body.data.cover) {
		await event.context.s3.putAnyObject(`shelf-covers/${user.id}/${shelf.id}`, body.data.cover);
	}

	return { success: true };
});
