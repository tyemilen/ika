<script lang="ts" setup>
import { UseTimeAgo } from '@vueuse/components';

const { data, status } = useLazyFetch('/api/users/@me/history');
</script>
<template>
	<h2>History</h2>

	<div class="flex flex-col gap-4">
		<div class="w-full flex gap-4" v-for="entry in data">
			<div class="cover-md">
				<BookCoverComponent :book-id="entry.book.id" :id="entry.book.coverId" />
			</div>
			<div class="flex flex-col flex-1 justify-between gap-4">
				<div>
					<div class="flex justify-between">
						<h2>{{ entry.book.title }}</h2>
						<UseTimeAgo
							v-if="entry.updatedAt"
							v-slot="{ timeAgo }"
							:time="entry.updatedAt"
						>
							<p class="text-xs">{{ timeAgo }}</p>
						</UseTimeAgo>
					</div>
					<p>{{ entry.chapter.name }}</p>
					<p>Потратил {{ entry.timeSpent }} секунд своей жизни</p>
				</div>

				<div class="flex gap-2 items-center">
					<div class="w-full h-2 bg-(--primary-container) rounded-full">
						<div
							class="h-full bg-(--on-primary-container) rounded-full"
							:style="{ width: `${entry.progress}%` }"
						></div>
					</div>
					<p>{{ entry.progress }}%</p>
				</div>
				<button
					@click="
						$router.push(
							`/reader/${entry.book.id}/${entry.chapter.id}/${entry.pageNumber}`,
						)
					"
				>
					{{ entry.chapter.name }}
				</button>
			</div>
		</div>
	</div>
</template>
