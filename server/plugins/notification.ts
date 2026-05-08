import { InferEnum } from 'drizzle-orm';

import { bookPublicationStatusEnum, bookStatusEnum, shelfBooks } from '~~/db';
import { notifyUser } from '../routes/ws';

const queue = new Map<string, number>();

export default defineNitroPlugin((nitroApp) => {
	const db = useNitroApp().db;

	console.log('[notification] we good');

	setInterval(async () => {
		if (queue.size === 0) return;

		const ids = [...queue.keys()];
		queue.clear();
		const notifications = await db.query.notifications.findMany({
			where: (n, { inArray }) => inArray(n.id, ids),
		});

		for (const n of notifications) {
			notifyUser(n.userId, n.data);
		}
	}, 1_000);

	nitroApp.hooks.hook('app:user:notification', async (event) => {
		queue.set(event.notificationId, Date.now());
	});
});
