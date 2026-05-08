import { BasePageCommentResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BasePageCommentResponse[]> => {
	const pageId = getRouterParam(event, 'id');

	if (!pageId)
		throw createError({
			statusCode: 404,
		});

	//! todo pagination
	const comments = await event.context.db.query.pageComments.findMany({
		where: (pageComments, { eq }) => eq(pageComments.pageId, pageId),
		with: {
			user: {
				columns: {
					username: true,
				},
				with: {
					profile: {
						columns: {
							display_name: true,
						},
					},
				},
			},
		},
	});

	return comments.map((p) => ({
		userId: p.userId,
		displayName: p.user.profile.display_name,
		username: p.user.username,
		text: p.text,
		createdAt: p.createdAt.getTime(),
	}));
});
