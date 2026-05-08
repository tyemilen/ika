import { ref } from 'vue';

const notifications = ref<AppNotification[]>([]);

const removeNotification = (notification: AppNotification) => {
	const index = notifications.value.findIndex((n) => n.id == notification.id);

	if (index == -1) return;

	notifications.value.splice(index, 1);
};

const createNotificationTimeout = async (notification: AppNotification) => {
	await new Promise((res) => setTimeout(res, notification.time));

	removeNotification(notification);
};

interface NotifyProps {
	type: AppNotificationType;
	text: string;
	time?: number;
}

export const useNotifications = () => {
	const notify = ({ type, text, time = 2500 }: NotifyProps): AppNotification => {
		const notification: AppNotification = {
			id: `notification_${type}-${notifications.value.length + 1}`,
			type,
			text,
			time,
		};

		notifications.value.push(notification);

		if (time != -1) createNotificationTimeout(notification);

		return notification;
	};

	return {
		notifications,
		notify,
		removeNotification,
	};
};
