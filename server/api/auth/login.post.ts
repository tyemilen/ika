import argon2 from 'argon2';

import { AuthLoginBodySchema, AuthUserResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<AuthUserResponse> => {
	const body = await readValidatedBody(event, (body) => AuthLoginBodySchema.safeParse(body));

	if (!body.success)
		throw createError({
			statusCode: 400,
			message: 'Bad credentials',
		});

	const { email, password } = body.data;

	const user = await event.context.db.query.users.findFirst({
		where: (users, { eq }) => eq(users.email, email.toLowerCase()),
	});

	if (!user)
		throw createError({
			statusCode: 400,
			message: 'Bad credentials',
		});

	if (await argon2.verify(user.password, password)) {
		const sessionUser = {
			id: user.id,
			role: user.role,
			sessionId: generateUserSessionId(user.id),
		};

		await setUserSession(event, {
			user: {
				id: user.id,
				role: user.role,
				sessionId: sessionUser.sessionId,
			},
		});
		await event.context.valkey.set(sessionUser.sessionId, JSON.stringify(sessionUser));

		return {
			id: user.id,
			username: user.username,
		};
	}

	throw createError({
		statusCode: 400,
		message: 'Bad credentials',
	});
});
