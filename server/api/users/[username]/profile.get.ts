import { and, count, eq, inArray, ne, not, sql, sum } from 'drizzle-orm';
import { readingHistory, shelfBooks, shelves, users } from '~~/db';
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

	const [timeSpentRaw] = await event.context.db
		.select({
			totalTime: sql<number>`sum(${readingHistory.timeSpent})`.mapWith(Number),
		})
		.from(readingHistory)
		.where(eq(readingHistory.userId, user.id));

	let ttw = 0;

	if (timeSpentRaw) {
		ttw = timeSpentRaw.totalTime;
	}

	const rawLikes = await event.context.db
		.select({ value: count() })
		.from(shelfBooks)
		.innerJoin(shelves, eq(shelfBooks.shelfId, shelves.id))
		.where(and(eq(shelves.type, 'liked'), eq(shelfBooks.userId, user.id)));

	const likes = Number(rawLikes[0]?.value ?? 0);

	const userShelves = await event.context.db.query.shelves.findMany({
		where: (shelves, { eq }) =>
			and(
				eq(shelves.userId, user.id),
				ne(shelves.type, 'generated'),
				ne(shelves.isPrivate, true),
			),
		limit: 6,
		columns: {
			id: true,
			name: true,
			type: true,
		},
	});

	const currentUser = await getUserSession(event);
	const currentUserId = currentUser?.user?.id;

	let compatibility: number | undefined = undefined;

	let topCommonBooks: {
		id: string;
		title: string;
		coverId: string;
		totalTime: number;
		myTime: number;
		targetTime: number;
	}[] = [];

	// todo: cache to valkey, also rewrite it maybe idk, its just a draft of an idea
	if (currentUserId && currentUserId != user.id) {
		compatibility = 0;

		calculate: {
			const targetReading = await event.context.db
				.select({
					bookId: readingHistory.bookId,
					time: sum(readingHistory.timeSpent),
				})
				.from(readingHistory)
				.where(eq(readingHistory.userId, user.id))
				.groupBy(readingHistory.bookId);

			if (targetReading.length === 0) break calculate;

			const myReading = await event.context.db
				.select({
					bookId: readingHistory.bookId,
					time: sum(readingHistory.timeSpent),
				})
				.from(readingHistory)
				.where(eq(readingHistory.userId, currentUserId))
				.groupBy(readingHistory.bookId);

			if (myReading.length === 0) break calculate;

			const myMap = new Map(myReading.map((r) => [r.bookId, Number(r.time ?? 0)]));

			const targetMap = new Map(targetReading.map((r) => [r.bookId, Number(r.time ?? 0)]));

			const commonBookIds = targetReading
				.filter((r) => myMap.has(r.bookId))
				.map((r) => r.bookId);

			const commonCount = commonBookIds.length;

			if (commonBookIds.length > 0) {
				const books = await event.context.db.query.books.findMany({
					where: (books, { inArray }) => inArray(books.id, commonBookIds),
					with: {
						titles: {
							columns: {
								title: true,
								isPrimary: true,
							},
						},
						covers: {
							columns: {
								id: true,
								isPrimary: true,
							},
						},
					},
				});

				topCommonBooks = books
					.map((book) => {
						const myTime = myMap.get(book.id) ?? 0;
						const targetTime = targetMap.get(book.id) ?? 0;

						return {
							id: book.id,
							title: book.titles.find((t) => t.isPrimary)!.title,
							coverId: book.covers.find((c) => c.isPrimary)!.id,
							myTime,
							targetTime,
							totalTime: myTime + targetTime,
						};
					})
					.sort((a, b) => b.totalTime - a.totalTime)
					.slice(0, 3);
			}

			const myTtw = myReading.reduce((acc, r) => acc + Number(r.time ?? 0), 0);
			const targetTtw = targetReading.reduce((acc, r) => acc + Number(r.time ?? 0), 0);

			const totalUniqueBooks = new Set([
				...targetReading.map((r) => r.bookId),
				...myReading.map((r) => r.bookId),
			]).size;

			const overlapScore = totalUniqueBooks > 0 ? (commonCount / totalUniqueBooks) * 60 : 0;

			const totalTimeRatio = Math.min(myTtw, targetTtw) / Math.max(myTtw, targetTtw);

			let engagementScore = 0;

			if (commonBookIds.length > 0) {
				const ratios = commonBookIds.map((bookId) => {
					const my = myMap.get(bookId) ?? 0;
					const target = targetMap.get(bookId) ?? 0;

					return Math.min(my, target) / Math.max(my, target);
				});

				engagementScore = (ratios.reduce((a, b) => a + b, 0) / ratios.length) * 40;
			}

			const timePenalty =
				totalTimeRatio < 0.1
					? 0.2
					: totalTimeRatio < 0.25
						? 0.6
						: totalTimeRatio < 0.5
							? 0.8
							: 1;

			compatibility = Math.round((overlapScore + engagementScore) * timePenalty);
		}
	}

	const result: UsersProfileResponse = {
		id: user.id,
		display_name: user.profile.display_name,
		username,
		bio: user.profile.bio,
		status: curStatus,
		ttw,
		likes,
		shelves: userShelves,
	};

	if (compatibility) {
		result.compatibility = {
			books: topCommonBooks,
			value: compatibility,
		};
	}

	return result;
});
