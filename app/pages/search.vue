<script setup lang="ts">
import constants from '~~/shared/constants';

import { type Reactive } from 'vue';

import type { BaseBookResponse, BooksSearchPostBody, MetaResponseEntry } from '~~/shared/schemas';

type Chip = Record<string, { active: boolean; id: string }>;

const meta = useMeta();

const createChips = (entries: MetaResponseEntry[]): Reactive<Chip> => {
	return reactive(
		entries.reduce((acc, { id, name }) => {
			acc[name] = {
				id,
				active: false,
			};
			return acc;
		}, {} as Chip),
	);
};

const genres = createChips(meta.genres);
const themes = createChips(meta.themes);

const query = reactive<BooksSearchPostBody>({
	title: '',
});

const results = ref<BaseBookResponse[]>([]);

const search = async () => {
	query.genres = Object.values(genres).flatMap((t) => (t.active ? [t.id] : []));
	query.themes = Object.values(themes).flatMap((t) => (t.active ? [t.id] : []));

	console.log(query);
	const result = await $fetch('/api/books/search', {
		method: 'POST',
		body: query,
	});

	results.value = result;
	console.log(result);
};
</script>
<template>
	<div class="flex gap-1">
		<input type="text" class="flex-1" placeholder="search" v-model="query.title" />
		<button @click="search">
			<span class="pi pi-search"></span>
		</button>
	</div>
	<div class="flex gap-2 flex-wrap">
		<div class="flex flex-col gap-2">
			<p>Book original language</p>
			<SelectComponent :options="meta.languages" placeholder="Language">
				<template #item="{ option, select }">
					<div
						@click="
							() => {
								select();
								query.language = option.id;
							}
						"
						class="p-2 flex items-center gap-2"
					>
						<span
							:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
						></span>
						<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
					</div>
				</template>
				<template #selected="{ option }">
					<div class="flex items-center gap-2">
						<span
							:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
						></span>
						<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
					</div>
				</template>
			</SelectComponent>
		</div>
		<div class="flex flex-col gap-2 flex-1">
			<p>Has chapter in</p>
			<SelectComponent :options="meta.languages" placeholder="Language">
				<template #item="{ option, select }">
					<div
						@click="
							() => {
								select();
								query.chapterLanguage = option.id;
							}
						"
						class="p-2 flex items-center gap-2"
					>
						<span
							:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
						></span>
						<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
					</div>
				</template>
				<template #selected="{ option }">
					<div class="flex items-center gap-2">
						<span
							:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
						></span>
						<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
					</div>
				</template>
			</SelectComponent>
		</div>
		<div class="flex flex-col gap-2 flex-1">
			<p>Publication status</p>
			<SelectComponent :options="constants.PUBLICATION_STATUS" placeholder="Status">
				<template #item="{ option, select }">
					<div
						@click="
							() => {
								select();
								query.publicationStatus = option;
							}
						"
						class="p-2 flex items-center gap-2"
					>
						<p>{{ option }}</p>
					</div>
				</template>
				<template #selected="{ option }">
					<div class="flex items-center gap-2">
						<p>{{ option }}</p>
					</div>
				</template>
			</SelectComponent>
		</div>
	</div>
	<div class="flex flex-col gap-2">
		<p>Genres</p>
		<div class="flex gap-1 flex-wrap">
			<div
				class="chip select-none cursor-pointer"
				v-for="(_, genre) in genres"
				@click="genres[genre]!.active = !genres[genre]?.active"
				:class="{ active: genres[genre]!.active }"
			>
				{{ genre }}
			</div>
		</div>
	</div>
	<div class="flex flex-col gap-2">
		<p>Themes</p>
		<div class="flex gap-1 flex-wrap">
			<div
				class="chip select-none cursor-pointer"
				v-for="(_, theme) in themes"
				@click="themes[theme]!.active = !themes[theme]?.active"
				:class="{ active: themes[theme]!.active }"
			>
				{{ theme }}
			</div>
		</div>
	</div>
	<div class="flex flex-col gap-4">
		<div v-for="book in results" class="flex gap-4">
			<BookCoverComponent class="cover-md" :book-id="book.id" :id="book.covers[0]!.id" />
			<p>{{ book.titles[0]!.content }}</p>
		</div>
	</div>
</template>
