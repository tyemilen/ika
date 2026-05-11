import { and, eq } from 'drizzle-orm';
import { notifications } from '~~/db';
import { UsersMeResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<UsersMeResponse> => {
	const { user } = await requireUserSession(event);

	const userInfo = await event.context.db.query.users.findFirst({
		where: (users, { eq }) => eq(users.id, user.id),
	});

	if (!userInfo)
		throw createError({
			statusCode: 403,
		});

	const profile = await event.context.db.query.profiles.findFirst({
		where: (profiles, { eq }) => eq(profiles.userId, user.id),
	});

	if (!profile)
		throw createError({
			statusCode: 401,
		});

	const shelf = await event.context.db.query.shelves.findFirst({
		where: (shelves, { eq, and }) =>
			and(eq(shelves.type, 'liked'), eq(shelves.userId, user.id)),
	});

	if (!shelf)
		throw createError({
			statusCode: 401,
		});

	const notificationsCount = await event.context.db.$count(
		notifications,
		and(eq(notifications.userId, userInfo.id), eq(notifications.isRead, false)),
	);

	return {
		id: userInfo.id,
		role: userInfo.role,
		displayName: profile.display_name,
		username: userInfo.username,
		likedShelfId: shelf.id,
		notificationsCount,
	};
});
