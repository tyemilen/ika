import { pageComments } from '~~/db';
import { BaseSuccessResponse, PageCommentsPostBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);
	const pageId = getRouterParam(event, 'id');

	if (!pageId)
		throw createError({
			statusCode: 404,
		});

	const body = await readValidatedBody(event, (body) =>
		PageCommentsPostBodySchema.safeParse(body),
	);

	if (!body.success)
		throw createError({
			statusCode: 401,
		});

	const [commentId] = await event.context.db
		.insert(pageComments)
		.values({
			pageId,
			userId: user.id,
			text: body.data.text,
		})
		.returning({ id: pageComments.id });

	if (!commentId)
		throw createError({
			statusCode: 401,
		});

	return { success: true };
});
