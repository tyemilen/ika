<script lang="ts" setup>
import type { BaseChapterResponse, BooksFeedResponse } from '~~/shared/schemas';

const { data: feed, status } = await useLazyFetch<BooksFeedResponse>('/api/books/feed');

const active = ref(0);
const freshFeed = computed(() => feed.value?.fresh ?? []);

const next = () => {
	let newVal = active.value + 1;
	if (newVal >= freshFeed.value.length) return;

	active.value = newVal;
};
const prev = () => {
	let newVal = active.value - 1;

	if (newVal < 0) return;

	active.value = newVal;
};
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
	<Teleport to="body">
		<NuxtLink
			v-if="lastBook"
			:to="`/reader/${lastBook.book.id}/${lastBook.chapter.id}/${lastBook.pageNumber}`"
			class="p-2 w-1/2 md:w-1/4 secondary-container shadow-lg rounded-md flex flex-col gap-4 fixed bottom-16 right-2 z-10"
		>
			<div class="flex items-center w-full gap-2">
				<span class="pi pi-book text-xl"></span>
				<p>Continue reading</p>
			</div>
			<!-- <p>{{ lastBook.book.title }}</p> -->
			<div class="flex w-full gap-2 items-center">
				<div class="w-full h-2 bg-(--on-secondary-container)/20 rounded-full">
					<div
						class="h-full bg-(--on-secondary-container) rounded-full"
						:style="{ width: `${lastBook.progress}%` }"
					></div>
				</div>
				<p>{{ lastBook.progress }}%</p>
			</div>
		</NuxtLink>
	</Teleport>

	<div class="flex">
		<div
			v-for="book in freshFeed"
			:style="{ transform: `translateX(-${active * 100}vw)` }"
			class="flex shrink-0 w-screen transition-transform"
		>
			<NuxtLink :to="`/books/${book.slug}`" class="flex gap-4 w-[95%] md:w-[70%]">
				<BookCoverComponent
					class="cover-xl shrink-0"
					:book-id="book.id"
					:id="book.covers.find((c) => c.isPrimary)!.id"
				/>
				<div class="flex flex-col justify-between min-w-0 wrap-break-word">
					<div class="flex flex-col">
						<h2>{{ book.titles[0]?.content }}</h2>
						<p>{{ book.descriptions?.[0]?.content.slice(0, 156) }}...</p>
					</div>

					<div class="flex gap-2 flex-end">
						<div v-for="genre in book.genres.slice(0, 2)" class="chip text-xs">
							{{ genre }}
						</div>
					</div>
				</div>
			</NuxtLink>
		</div>
	</div>
	<div class="flex w-full justify-between">
		<button @click="prev">
			<span class="pi pi-angle-left"></span>
		</button>
		<button @click="next">
			<span class="pi pi-angle-right"></span>
		</button>
	</div>

	<div class="flex flex-col md:flex-row gap-4 w-full" v-if="chapters">
		<ChaptersSectionVertiComponent class="w-full md:w-1/2" :chapters="chapters[0]" />
		<ChaptersSectionVertiComponent
			class="w-full md:w-1/2"
			v-if="chapters[1].length"
			:chapters="chapters[1]"
		/>
	</div>
	<h2>Trending rn</h2>
	<NuxtLink
		v-for="(book, index) in feed?.trending"
		:to="`/books/${book.slug}`"
		class="primary-container flex flex-col gap-2"
	>
		<h3>
			{{ index + 1 }}. {{ book.titles[0]?.content }}
			<span class="font-mono text-sm font-normal secondary-container">{{ book.score }}</span>
		</h3>
		<div class="flex gap-4 items-start">
			<BookCoverComponent
				class="cover-md shrink-0"
				:book-id="book.id"
				:id="book.covers.find((c) => c.isPrimary)!.id"
			/>
			<div class="flex flex-col">
				<p>{{ book.descriptions[0]?.content }}</p>
			</div>
		</div>
	</NuxtLink>
	<!-- <BookSectionHorizComponent></BookSectionHorizComponent> -->
</template>
