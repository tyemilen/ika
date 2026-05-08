interface State {
	notifications: any[];
}

const state = ref<State>({
	notifications: [],
});

export const useGlobalState = () => {
	const addNotification = (notification: any) => {
		state.value.notifications.push(notification);
	};

	const clearNotifications = () => {
		state.value.notifications = [];
	};

	return {
		state,
		addNotification,
		clearNotifications,
	};
};
