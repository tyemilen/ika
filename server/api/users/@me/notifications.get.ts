import { NotificationType } from '~~/shared';
import {
	BaseNotificationResponse,
	NotifMyBookStatusUpdateData,
	NotifNewChapterData,
} from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseNotificationResponse[]> => {
	const { user } = await requireUserSession(event);

	const notificationsRaw = await event.context.db.query.notifications.findMany({
		where: (notifications, { eq }) => eq(notifications.userId, user.id),
		orderBy: (notifications, { desc }) => [desc(notifications.createdAt)],
	});

	const notifications = notificationsRaw.flatMap((n): BaseNotificationResponse[] => {
		switch (n.type as NotificationType) {
			case 'new_chapter': {
				const data = n.data as NotifNewChapterData;
				return [
					{
						type: 'new_chapter',
						display: {
							title: `New chapter for ${data.book_title}`,
							description: `new_chapter ${data.name} ${data.volume} ${data.number}`,
							thumbnail: `${data.book_id}/${data.cover_id}`,
						},
						createdAt: n.createdAt.getTime(),
					},
				];
			}
			case 'my_book_status_update': {
				const data = n.data as NotifMyBookStatusUpdateData;
				return [
					{
						type: 'my_book_status_update',
						display: {
							title: data.title,
							description: 'book_update_description',
							thumbnail: `${data.book_id}/${data.cover_id}`,
						},
						createdAt: n.createdAt.getTime(),
					},
				];
			}
			default:
				return [];
		}
	});

	return notifications;
});
