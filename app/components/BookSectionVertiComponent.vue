<script setup lang="ts">
import { UseTimeAgo } from '@vueuse/components';
import type { BaseChapterResponse } from '~~/shared/schemas';

defineProps<{
	chapters: BaseChapterResponse[];
}>();
</script>
<template>
	<div class="flex flex-col gap-2 bg-(--bg-secondary) p-2 rounded-sm">
		<NuxtLink
			class="flex gap-2 shrink-0 w-full"
			v-for="(chapter, i) in chapters"
			:key="i"
			:to="`/reader/${chapter.bookId}/${chapter.id}/1`"
		>
			<div class="cover-md">
				<NuxtImg provider="covers" :src="chapter.cover" />
			</div>
			<div class="flex flex-col gap-1 flex-1">
				<div class="font-medium">{{ chapter.name }}</div>
				<p class="grow">
					<span
						:class="['fi', `fi-${$t(`languages.${chapter.language}.fi-code`)}`]"
					></span>
					Vol. {{ chapter.volume }} Ch {{ chapter.number }}
				</p>
				<div class="flex justify-between items-center">
					<p>{{ chapter.author.username }}</p>
					<UseTimeAgo
						v-if="chapter.createdAt"
						v-slot="{ timeAgo }"
						:time="chapter.createdAt"
					>
						<p class="text-xs">{{ timeAgo }}</p>
					</UseTimeAgo>
				</div>
			</div>
		</NuxtLink>
	</div>
</template>
