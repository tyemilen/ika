<script lang="ts" setup>
import type { BaseChapterResponse, BooksFeedResponse } from '~~/shared/schemas';

const { data: feed, status } = await useLazyFetch<BooksFeedResponse>('/api/books/feed');

const freshFeed = computed(() => feed.value?.fresh ?? []);

const chapters = computed<[BaseChapterResponse[], BaseChapterResponse[]]>(() => {
	if (!feed.value?.chapters) return [[], []];
	const middleIndex = Math.ceil(feed.value.chapters.length / 2);

	const firstHalf = feed.value.chapters.slice(0, middleIndex);
	const secondHalf = feed.value.chapters.slice(middleIndex);

	return [firstHalf, secondHalf];
});
const { data: lastBook } = useLazyFetch('/api/users/@me/history/last');
</script>
<template>
	<NuxtLink
		v-if="lastBook"
		:to="`/reader/${lastBook.book.id}/${lastBook.chapter.id}/${lastBook.pageNumber}`"
		class="p-2 w-[95%] bg-(--bg-primary) shadow-lg rounded-md flex flex-col gap-4 justify-center items-center fixed bottom-16 right-2 z-10 opacity-0"
	>
		<div class="flex w-full gap-2">
			<div class="cover-xs">
				<BookCoverComponent :book-id="lastBook.book.id" :id="lastBook.book.coverId" />
			</div>
			<div class="flex flex-col">
				<p>Continue reading</p>
				<p>{{ lastBook.book.title }}</p>
				<p>{{ lastBook.chapter.name }} / page: {{ lastBook.pageNumber }}</p>
			</div>
			<div class="flex-1 text-end">
				<span class="pi pi-angle-right text-xl"></span>
			</div>
		</div>

		<div class="flex w-full gap-2 items-center">
			<div class="w-full h-2 bg-(--bg-secondary) rounded-full">
				<div
					class="h-full bg-(--color-primary) rounded-full"
					:style="{ width: `${lastBook.progress}%` }"
				></div>
			</div>
			<p>{{ lastBook.progress }}%</p>
		</div>
	</NuxtLink>

	<div v-for="book in freshFeed" class="flex break-all">
		<NuxtLink :to="`/books/${book.slug}`">
			<BookCoverComponent :book-id="book.id" :id="book.covers.find((c) => c.isPrimary)!.id" />
		</NuxtLink>
	</div>

	<div class="flex flex-col gap-4 pt-5 bg-red-500" :class="{ 'is-loading': status == 'pending' }">
		<div class="flex flex-col md:flex-row gap-4 w-full" v-if="chapters">
			<BookSectionVertiComponent class="w-full md:w-1/2" :chapters="chapters[0]" />
			<BookSectionVertiComponent
				class="w-full md:w-1/2"
				v-if="chapters[1].length"
				:chapters="chapters[1]"
			/>
		</div>
		<!-- <BookSectionHorizComponent></BookSectionHorizComponent> -->
	</div>
</template>
