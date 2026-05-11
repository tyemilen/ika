<script lang="ts" setup>
import { UseTimeAgo } from '@vueuse/components';

const { data: notifications, status } = useLazyFetch('/api/users/@me/notifications');
</script>
<template>
	<div class="flex flex-col gap-4" :class="{ 'is-loading': status != 'success' }">
		<h2>Notifications</h2>

		<div v-for="notification in notifications" class="flex gap-2">
			<div class="cover-xs">
				<NuxtImg provider="covers" :src="notification.display.thumbnail" />
			</div>
			<div class="flex flex-col w-full">
				<div class="flex w-full justify-between items-center">
					<p class="font-bold">{{ notification.display.title }}</p>
					<UseTimeAgo
						v-if="notification.createdAt"
						v-slot="{ timeAgo }"
						:time="notification.createdAt"
					>
						<p class="text-xs">{{ timeAgo }}</p>
					</UseTimeAgo>
				</div>
				<p>{{ notification.display.description }}</p>
			</div>
		</div>
	</div>
</template>
