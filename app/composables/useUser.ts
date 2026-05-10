import type { UsersMeResponse } from '~~/shared/schemas';

const user = ref<UsersMeResponse | null>(null);

export const useUser = () => {
	const session = useUserSession();

	const logout = async () => {
		try {
			await session.clear();

			clearNuxtData();
			clearNuxtState();

			user.value = null;

			await navigateTo('/');
			window.location.reload();
		} catch (err) {
			console.error(err);
		}
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
