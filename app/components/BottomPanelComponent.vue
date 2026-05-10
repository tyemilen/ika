<script setup lang="ts">
import UserAvatarComponent from './kit/UserAvatarComponent.vue';

const { user } = useUser();

const route = useRoute();

const isActive = (path: string) => route.path == path;

const { state } = useGlobalState();
const notificationsCount = computed(() => {
	if (!state.value.notifications.length || !user.value?.notificationsCount) return 0;

	return state.value.notifications.length + user.value.notificationsCount;
});

const activeClass = 'text-(--on-primary-container) bg-(--primary-container)';
</script>

<template>
	<ClientOnly>
		<nav
			class="left-0 right-0 flex h-14 w-full items-center justify-around border-t border-(--outline-v) px-4 p-2"
		>
			<NuxtLink
				to="/"
				class="relative flex h-full px-4 items-center justify-center rounded-full"
				:class="{ [activeClass]: isActive('/') }"
			>
				<span class="pi pi-home text-xl"></span>
			</NuxtLink>
			<NuxtLink
				to="/search"
				class="relative flex h-full px-4 items-center justify-center rounded-full"
				:class="{ [activeClass]: isActive('/search') }"
			>
				<span class="pi pi-search text-xl"></span>
			</NuxtLink>
			<template v-if="user">
				<NuxtLink
					to="/my/library"
					class="relative flex h-full px-4 items-center justify-center rounded-full"
					:class="{ [activeClass]: isActive('/my/library') }"
				>
					<span class="pi pi-bookmark text-xl"></span>
				</NuxtLink>

				<NuxtLink
					to="/my/notifications"
					class="relative flex h-full px-4 items-center justify-center rounded-full"
					:class="{ [activeClass]: isActive('/my/notifications') }"
				>
					<span class="pi pi-bell text-xl"></span>
					<div
						v-if="!isActive('/my/notifications') && notificationsCount"
						class="absolute border-2 font-medium border-(--surface) p-2 w-5 h-5 bg-(--primary) text-(--on-primary) top-1/6 left-1/2 rounded-full text-xs text-center flex items-center justify-center"
					>
						{{ notificationsCount > 99 ? ':3' : notificationsCount }}
					</div>
				</NuxtLink>

				<NuxtLink
					:to="`/profile/${user.username}`"
					class="relative flex h-full px-4 items-center justify-center rounded-full"
					:class="{ [activeClass]: isActive(`/profile/${user.username}`) }"
				>
					<div class="w-6 h-6 p-px border rounded-full">
						<UserAvatarComponent class="rounded-full h-full w-full" :id="user.id" />
					</div>
				</NuxtLink>
			</template>
		</nav>
	</ClientOnly>
</template>
