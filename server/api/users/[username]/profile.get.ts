import { UsersProfileResponse, WsUserStatus } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<UsersProfileResponse> => {
	const username = event.context.params?.username;

	if (!username)
		throw createError({
			statusCode: 404,
		});

	const user = await event.context.db.query.users.findFirst({
		where: (users, { eq }) => eq(users.username, username),
		columns: {
			id: true,
		},
		with: {
			profile: true,
		},
	});

	if (!user)
		throw createError({
			statusCode: 404,
			message: 'Not found',
		});

	let curStatus: WsUserStatus = {
		bookName: null,
		status: 'offline' as USER_STATUS,
		lastSeen: 0,
	};

	const status = await event.context.valkey.get(`status:${user.id}`);

	if (status) {
		const parsed: WsUserStatus = JSON.parse(status.toString());

		const realStatus = (Date.now() - parsed.lastSeen) / 1000 > 120 ? 'offline' : parsed.status;

		curStatus = {
			bookName: parsed.bookName,
			status: realStatus as USER_STATUS,
			lastSeen: parsed.lastSeen,
		};
	}
	return {
		id: user.id,
		display_name: user.profile.display_name,
		username,
		bio: user.profile.bio,
		status: curStatus,
	};
});
