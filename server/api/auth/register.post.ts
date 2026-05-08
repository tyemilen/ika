import argon2 from 'argon2';

import { users, profiles, shelves } from '~~/db';

import { AuthRegisterBodySchema, AuthUserResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<AuthUserResponse> => {
	const body = await readValidatedBody(event, (body) => AuthRegisterBodySchema.safeParse(body));

	if (!body.success)
		throw createError({
			statusCode: 400,
			message: body.error.message,
		});

	const { email, username, password } = body.data;

	const existingUser = await event.context.db.query.users.findFirst({
		where: (users, { eq, or }) => or(eq(users.email, email), eq(users.username, username)),
	});

	if (existingUser) {
		const message =
			existingUser.email === email ? 'Email already taken' : 'Username already taken';

		throw createError({
			statusCode: 409,
			message: message,
		});
	}

	const result = await event.context.db.transaction(async (tx) => {
		const [user] = await tx
			.insert(users)
			.values({
				email: email.toLowerCase(),
				username,
				password: await argon2.hash(password),
			})
			.returning({ id: users.id });

		if (!user) throw new Error('brtuh');

		const [profile] = await tx
			.insert(profiles)
			.values({
				userId: user.id,
				display_name: username,
			})
			.returning({ id: profiles.id });

		if (!profile) throw new Error('brtuh');

		const [shelf] = await tx
			.insert(shelves)
			.values({
				userId: user.id,
				name: 'liked',
				type: 'liked',
			})
			.returning({ id: shelves.id });

		if (!shelf) throw new Error('bvurh');

		return user;
	});

	if (!result)
		throw createError({
			statusCode: 400,
			message: 'Bad credentials',
		});

	return {
		id: result.id,
	};
});
