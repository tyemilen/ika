<script setup lang="ts">
import constants from '~~/shared/constants';

import { type Reactive } from 'vue';
import { BooksPostBodySchema, type BooksPostBody, type MetaResponseEntry } from '~~/shared/schemas';

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

const bookForm = reactive<BooksPostBody>({
	authorsIds: [],
	authorsNames: [],

	artistsIds: [],
	artistsNames: [],

	publicationYear: 2026,
	language: '',

	genres: [],
	themes: [],

	title: '',
	titleLang: '',
	titles: [],

	descriptions: [],
	publicationStatus: null as unknown as 'ongoing',

	cover: null as unknown as File,
});

watch(genres, () => {
	bookForm.genres = Object.values(genres)
		.map((x) => (x.active ? x.id : null))
		.filter(Boolean) as string[];
});
watch(themes, () => {
	bookForm.themes = Object.values(themes)
		.map((x) => (x.active ? x.id : null))
		.filter(Boolean) as string[];
});

const artistNameRef = useTemplateRef<HTMLInputElement>('artistNameRef');
const addArtistName = () => {
	if (!artistNameRef.value) return;

	const name = artistNameRef.value.value.trim();

	if (name.length >= 1) {
		bookForm.artistsNames.push(name);
		artistNameRef.value.value = '';
	}
};

interface AltContent {
	lang: string;
	content: string;
}

const altTitles = reactive<AltContent[]>([]);
const altTitlesRef = useTemplateRef<HTMLInputElement[]>('altTitleInputs');
const addAltTitle = async () => {
	altTitles.push({ lang: '', content: '' });
	await nextTick();

	if (!altTitlesRef.value) return;
	altTitlesRef.value[altTitlesRef.value.length - 1]?.focus();
};

const altDescriptionTemp = ref<AltContent>({
	lang: '',
	content: '',
});
const altDescriptions = reactive<AltContent[]>([]);
const altDescriptionModal = ref(false);

const saveTempAltDescription = () => {
	altDescriptions.push({ ...altDescriptionTemp.value });
	console.log(meta.languages.findIndex((x) => x.id == altDescriptionTemp.value.lang));

	altDescriptionTemp.value.lang = '';
	altDescriptionTemp.value.content = '';
	altDescriptionModal.value = false;
};

const authorNameRef = useTemplateRef<HTMLInputElement>('authorNameRef');
const addAuthorName = () => {
	if (!authorNameRef.value) return;

	const name = authorNameRef.value.value.trim();

	if (name.length >= 1) {
		bookForm.authorsNames.push(name);
		authorNameRef.value.value = '';
	}
};

const coverUrl = ref<string | null>(null);
const handleCoverUpload = (event: Event) => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		coverUrl.value = URL.createObjectURL(file);
		bookForm.cover = file;
	}
};

const { notify } = useNotifications();

const postBook = async () => {
	bookForm.titles = altTitles.map((x) => ({ language: x.lang, content: x.content }));
	bookForm.descriptions = altDescriptions.map((x) => ({ language: x.lang, content: x.content }));

	const res = BooksPostBodySchema.safeParse(bookForm);

	if (!res.success) {
		notify({
			type: 'error',
			text: res.error.issues[0]?.message || 'Invalid form',
		});
		return;
	}

	const formData = new FormData();

	formData.append('title', bookForm.title);
	formData.append('titleLang', bookForm.titleLang);
	formData.append('language', bookForm.language);
	formData.append('publicationYear', String(bookForm.publicationYear));
	formData.append('publicationStatus', bookForm.publicationStatus || '');
	formData.append('authorsIds', JSON.stringify(bookForm.authorsIds));
	formData.append('authorsNames', JSON.stringify(bookForm.authorsNames));
	formData.append('artistsIds', JSON.stringify(bookForm.artistsIds));
	formData.append('artistsNames', JSON.stringify(bookForm.artistsNames));
	formData.append('genres', JSON.stringify(bookForm.genres));
	formData.append('themes', JSON.stringify(bookForm.themes));
	formData.append('titles', JSON.stringify(bookForm.titles));
	formData.append('descriptions', JSON.stringify(bookForm.descriptions));
	formData.append('cover', bookForm.cover);

	const response = await $fetchNotify('/api/books', {
		method: 'POST',
		body: formData,
	});
};

onUnmounted(() => {
	if (coverUrl.value) URL.revokeObjectURL(coverUrl.value);
});
</script>

<template>
	<form class="flex flex-col gap-4 justify-center pb-5" @submit.prevent="postBook()">
		<h3>Create book draft</h3>
		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<p>Title</p>
				<div class="flex gap-1 justify-center items-stretch">
					<SelectComponent
						:options="meta?.languages"
						placeholder="Language"
						:stretch="true"
					>
						<template #item="{ option, select }">
							<div
								@click="
									() => {
										select();
										bookForm.titleLang = option.id;
									}
								"
								class="p-2 flex items-center gap-2"
							>
								<span
									:class="[
										'shrink-0',
										'fi',
										`fi-${$t(`languages.${option.code}.fi-code`)}`,
									]"
								></span>
								<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
							</div>
						</template>
						<template #selected="{ option }">
							<div class="flex items-center gap-2">
								<span
									:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
								></span>
							</div>
						</template>
					</SelectComponent>

					<input type="text" class="flex-1" v-model="bookForm.title" />
				</div>
			</div>
			<div class="flex flex-col gap-2" @keydown.enter.prevent="addAltTitle">
				<p>Alternative titles</p>
				<div class="flex gap-1" v-for="(_, index) in altTitles">
					<SelectComponent
						:options="meta?.languages"
						placeholder="Language"
						:stretch="true"
					>
						<template #item="{ option, select }">
							<div
								@click="
									() => {
										select();
										altTitles[index]!.lang = option.id;
									}
								"
								class="p-2 flex items-center gap-2"
							>
								<span
									:class="[
										'shrink-0',
										'fi',
										`fi-${$t(`languages.${option.code}.fi-code`)}`,
									]"
								></span>
								<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
							</div>
						</template>
						<template #selected="{ option }">
							<div class="flex items-center gap-2">
								<span
									:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
								></span>
							</div>
						</template>
					</SelectComponent>

					<input
						type="text"
						class="min-w-0 flex-1"
						v-model="altTitles[index]!.content"
						ref="altTitleInputs"
					/>
					<button @click.prevent="altTitles.splice(index, 1)">
						<span class="pi pi-trash"></span>
					</button>
				</div>
				<button @click.prevent="addAltTitle()">
					<span class="pi pi-plus"></span>
					<p>Add alternative title</p>
				</button>
			</div>
			<div class="flex flex-col gap-2">
				<p>Descriptions</p>
				<div
					class="flex gap-1 justify-center items-stretch"
					v-for="(decription, index) in altDescriptions"
				>
					<SelectComponent
						:options="meta?.languages"
						placeholder="Language"
						:stretch="true"
						:value="meta.languages.findIndex((x) => x.id == decription.lang)"
						class="h-fit"
					>
						<template #item="{ option, select }">
							<div
								@click="
									() => {
										select();
										altDescriptions[index]!.lang = option.id;
									}
								"
								class="p-2 flex items-center gap-2"
							>
								<span
									:class="[
										'shrink-0',
										'fi',
										`fi-${$t(`languages.${option.code}.fi-code`)}`,
									]"
								></span>
								<p>{{ $t(`languages.${option.code}.display_name`) }}</p>
							</div>
						</template>
						<template #selected="{ option }">
							<div class="flex items-center gap-2">
								<span
									:class="['fi', `fi-${$t(`languages.${option.code}.fi-code`)}`]"
								></span>
							</div>
						</template>
					</SelectComponent>

					<div
						class="w-full items-center bg-(--bg-secondary) p-1 rounded-md overflow-hidden"
					>
						<p>{{ altDescriptions[index]!.content }}</p>
					</div>
					<button @click.prevent="">
						<span class="pi pi-pencil"></span>
					</button>
					<button @click.prevent="altDescriptions.splice(index, 1)">
						<span class="pi pi-trash"></span>
					</button>
				</div>
				<button @click.prevent="altDescriptionModal = true">
					<span class="pi pi-plus"></span>
					<p>Add description</p>
				</button>
			</div>
		</div>
		<hr />

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<p>Authors</p>
				<div class="flex gap-1">
					<input
						class="flex-1"
						type="text"
						placeholder="Find author"
						ref="authorNameRef"
					/>
					<button @click.prevent="addAuthorName">+</button>
				</div>
				<div class="flex gap-1 flex-wrap">
					<div
						class="chip gap-2"
						v-for="(name, index) in bookForm.authorsNames"
						@click="bookForm.authorsNames.splice(index, 1)"
					>
						<span class="pi pi-times"></span>
						<p>{{ name }}</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<p>Artists</p>
				<div class="flex gap-1">
					<input
						class="flex-1"
						type="text"
						placeholder="Find artist"
						ref="artistNameRef"
					/>
					<button @click.prevent="addArtistName">+</button>
				</div>
				<div class="flex gap-1 flex-wrap">
					<div
						class="chip gap-2"
						v-for="(name, index) in bookForm.artistsNames"
						@click="bookForm.artistsNames.splice(index, 1)"
					>
						<span class="pi pi-times"></span>
						<p>{{ name }}</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-2">
				<p>Original language</p>
				<SelectComponent :options="meta?.languages" placeholder="Language">
					<template #item="{ option, select }">
						<div
							@click="
								() => {
									select();
									bookForm.language = option.id;
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

			<div class="flex flex-col gap-2">
				<p>Publication status</p>
				<SelectComponent :options="constants.PUBLICATION_STATUS" placeholder="Status">
					<template #item="{ option, select }">
						<div
							@click="
								() => {
									select();
									bookForm.publicationStatus = option;
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

			<div class="flex flex-col gap-2">
				<p>Publication year</p>
				<input
					type="number"
					placeholder="Publication year"
					v-model="bookForm.publicationYear"
				/>
			</div>
		</div>
		<hr class="text-stone-200" />

		<div class="flex flex-col gap-4">
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
		</div>
		<hr />

		<div class="flex flex-col gap-4">
			<div class="flex flex-col gap-2">
				<p>Cover</p>
				<div class="flex gap-1 flex-wrap">
					<label
						class="bg-transparent! cover-big border border-dashed border-(--text-placeholder) flex justify-center bg-cover items-center"
						:style="{ backgroundImage: coverUrl ? `url(${coverUrl})` : 'none' }"
					>
						<span class="pi pi-plus"></span>
						<input
							type="file"
							class="hidden"
							@change="handleCoverUpload"
							:accept="`${constants.ACCEPTED_IMAGE_TYPES.join(',')}`"
						/>
					</label>
				</div>
			</div>
		</div>
		<div class="flex gap-2 w-full sticky bottom-0 bg-(--surface) p-2">
			<button class="flex-1 secondary">Cancel</button>
			<button class="flex-1" type="submit">Save</button>
		</div>
	</form>

	<Teleport to="body">
		<div class="modal-container" v-show="altDescriptionModal">
			<div class="modal w-[90%] h-1/2">
				<SelectComponent :options="meta?.languages" placeholder="Language" class="h-fit">
					<template #item="{ option, select }">
						<div
							@click="
								() => {
									altDescriptionTemp.lang = option.id;
									select();
								}
							"
							class="p-2 flex items-center gap-2"
						>
							<span
								:class="[
									'shrink-0',
									'fi',
									`fi-${$t(`languages.${option.code}.fi-code`)}`,
								]"
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

				<div class="flex gap-2 flex-1">
					<textarea class="w-full h-full" v-model="altDescriptionTemp.content"></textarea>
					<!-- <textarea class="w-full h-full"></textarea> -->
				</div>
				<div class="flex flex-col gap-2">
					<button @click="saveTempAltDescription()">save</button>
					<button @click="altDescriptionModal = false" class="secondary">cancel</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>
