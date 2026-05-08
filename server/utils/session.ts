import type { H3Event } from 'h3';

import { randomUUID } from 'crypto';

export const generateUserSessionId = (userId: string) => `${userId}-${randomUUID()}`;

// export async function requireUserSession(event: H3Event): Promise<UserSession> {
// 	const { user: userSession } = await getUserSession(event);

// 	if (!userSession)
// 		throw createError({
// 			statusCode: 401,
// 			statusMessage: 'Unauthorized',
// 		});

// 	const user = await event.context.valkey.get(userSession?.sessionId);

// 	if (!user)
// 		throw createError({
// 			statusCode: 401,
// 			statusMessage: 'Unauthorized',
// 		});

// 	return JSON.parse(user.toString());
// }

// export async function getUserFromSession(event: H3Event): Promise<UserSession | null> {
// 	const { user: userSession } = await getUserSession(event);

// 	if (!userSession) return null;

// 	const user = await event.context.valkey.get(userSession?.sessionId);

// 	if (!user) return null;

// 	return JSON.parse(user.toString());
// }
