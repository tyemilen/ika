<script setup lang="ts">
import UserAvatarComponent from './kit/UserAvatarComponent.vue';

const { user } = useUser();

const route = useRoute();

const isActive = (path: string) => route.path == path;

const { state } = useGlobalState();
</script>

<template>
	<nav
		class="left-0 right-0 flex h-14 w-full items-center justify-around border-t border-(--outline-v) px-4"
	>
		<NuxtLink
			to="/"
			class="relative flex h-full px-4 items-center justify-center"
			:class="{ 'text-(--color-primary)': isActive('/') }"
		>
			<span class="pi pi-home text-xl"></span>
		</NuxtLink>
		<NuxtLink
			to="/search"
			class="relative flex h-full px-4 items-center justify-center"
			:class="{ 'text-(--color-primary)': isActive('/search') }"
		>
			<span class="pi pi-search text-xl"></span>
		</NuxtLink>
		<template v-if="user">
			<NuxtLink
				to="/my/library"
				class="relative flex h-full px-4 items-center justify-center"
				:class="{ 'text-(--color-primary)': isActive('/my/library') }"
			>
				<span class="pi pi-bookmark text-xl"></span>
			</NuxtLink>

			<NuxtLink
				to="/my/notifications"
				class="relative flex h-full px-4 items-center justify-center"
				:class="{ 'text-(--color-primary)': isActive('/my/notifications') }"
			>
				<span class="pi pi-bell text-xl"></span>
				<div
					v-if="
						!isActive('/my/notifications') &&
						(state.notifications.length || user.notificationsCount)
					"
					class="absolute border-2 font-medium border-(--bg-primary) p-2 w-5 h-5 bg-(--color-primary) top-1/6 left-1/2 rounded-full text-xs text-center flex items-center justify-center"
				>
					{{ user.notificationsCount + state.notifications.length }}
				</div>
			</NuxtLink>

			<NuxtLink
				:to="`/profile/${user.username}`"
				class="relative flex h-full px-4 items-center justify-center"
				:class="{ 'text-(--color-primary)': isActive(`/profile/${user.username}`) }"
			>
				<div class="w-6 h-6 p-px border rounded-full">
					<UserAvatarComponent class="rounded-full h-full w-full" :id="user.id" />
				</div>
			</NuxtLink>
		</template>
	</nav>
</template>
