import type { UsersMeResponse } from '~~/shared/schemas';

const user = ref<UsersMeResponse | null>(null);

export const useUser = () => {
	const session = useUserSession();

	const logout = async () => {
		session.clear();
		clearNuxtData();
		clearNuxtState();

		await reloadNuxtApp({
			path: '/',
			ttl: 1000,
		});
	};

	const fetchUser = async () => {
		if (!session.loggedIn.value) return;

		const { data } = await useFetch('/api/users/@me');

		if (!data.value) {
			await logout();
			return;
		}

		user.value = {
			id: data.value.id,
			role: data.value.role,
			displayName: data.value.displayName,
			username: data.value.username,
			likedShelfId: data.value.likedShelfId,
			notificationsCount: data.value.notificationsCount,
		};
	};

	const set = (data: UsersMeResponse) => {
		user.value = data;
	};

	return {
		fetchUser,
		user,
		logout,
		set,
	};
};
