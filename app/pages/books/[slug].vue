<script lang="ts" setup>
import Error from '~/error.vue';
import type { BookGetResponse } from '~~/shared/schemas';

const router = useRouter();
const route = useRoute();

const showCChapterModal = ref(false);
const showSaveModal = ref(false);

const {
	data: book,
	status,
	error,
} = await useFetch<BookGetResponse>(`/api/books/${route.params.slug}`, {
	deep: true,
});

const config = useRuntimeConfig();

const ogImage = computed(() => {
	if (!book.value) return null;

	const coverId = book.value.covers.find((c) => c.isPrimary)?.id;

	return coverId ? `${config.public.coversCdnBase}/${book.value.id}/${coverId}` : null;
});

if (import.meta.server) {
	useSeoMeta({
		title: book.value?.titles[0]?.content || '...',
		ogTitle: book.value?.titles[0]?.content,
		ogDescription: book.value?.descriptions?.[0]?.content,
		themeColor: '#93cdf6',
		ogImage,
		twitterCard: 'summary_large_image',
	});
}

const read = (chapter?: string) => {
	if (!chapter) return;
	if (!book.value) return;

	router.push({
		path: `/reader/${book.value.id}/${chapter}/1`,
	});
};

const { user } = useUser();

const likeBook = () => {
	if (!book.value || !user.value) return;

	const currentLikes = book.value.likes ?? 0;

	if (book.value.liked) {
		book.value.likes = currentLikes - 1;
		book.value.liked = false;

		$fetchNotify(`/api/books/${book.value.id}/unsave`, {
			method: 'POST',
			body: {
				shelfId: user.value.likedShelfId,
			},
		});
	} else {
		book.value.likes = currentLikes + 1;
		book.value.liked = true;

		$fetchNotify(`/api/books/${book.value.id}/save`, {
			method: 'PATCH',
			body: {
				shelfId: user.value.likedShelfId,
			},
		});
	}
};

const primaryCover = computed<string>(() => {
	if (!book.value?.id) return '';

	return `${book.value.id}/${book.value.covers.find((v) => v.isPrimary)?.id}`;
});

const adminHide = async () => {
	if (!book.value) return;

	console.log(`/api/special/books/${book.value.id}/hide`);
	await $fetchNotify(`/api/special/books/${book.value.id}/hide`, {
		method: 'PATCH',
	});
};
</script>
<template>
	<Error
		v-if="error || status == 'idle'"
		:error="
			createError({
				statusCode: 404,
				statusMessage: 'Book not found',
				fatal: false,
			})
		"
	/>
	<template v-else>
		<div class="flex flex-col gap-4" :class="{ 'is-loading': status == 'pending' }">
			<div class="flex gap-4" v-if="book">
				<BookCoverComponent
					class="rounded-md cover-auto"
					:book-id="book?.id"
					:id="book.covers.find((c) => c.isPrimary)!.id"
				/>
				<div class="flex flex-col justify-between">
					<div>
						<h2>{{ book.titles[0]?.content }}</h2>
						<p>{{ book.titles[1]?.content }}</p>
					</div>
					<div class="flex gap-2">
						<div class="flex items-center gap-1 text-(--star)">
							<span class="pi pi-star"></span>
							<p>0</p>
						</div>
						<div class="flex items-center gap-1 text-(--love)">
							<span class="pi pi-heart"></span>
							<p>{{ book.likes }}</p>
						</div>
					</div>
				</div>
			</div>
			<div class="flex gap-1">
				<button @click="likeBook">
					<span
						class="pi"
						:class="{ 'pi-heart': !book?.liked, 'pi-heart-fill': book?.liked }"
					></span>
				</button>
				<button>
					<span class="pi pi-star"></span>
				</button>
				<MenuComponent name="book-more" :stretch="true">
					<template #activator>
						<button class="relative h-full">
							<span class="pi pi-ellipsis-h"></span>
						</button>
					</template>
					<template #list>
						<p @click="showSaveModal = true">Save</p>
						<p @click="showCChapterModal = true">Upload chapter</p>
						<p>Share</p>
						<p>= danger zone =</p>
						<p v-if="user?.role == 'admin'" @click="adminHide">Hide</p>
					</template>
				</MenuComponent>
				<button class="secondary flex-1" @click="read(book?.chapters?.[0]?.id)">
					READ
				</button>
			</div>
			<p>{{ book?.descriptions?.[0]?.content }}</p>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<h2>Genres</h2>
					<div class="flex gap-2">
						<div class="chip" v-for="genre in book?.genres">{{ genre }}</div>
					</div>
				</div>
				<div class="flex flex-col gap-2">
					<h2>Themes</h2>
					<div class="flex gap-2">
						<div class="chip" v-for="theme in book?.themes">{{ theme }}</div>
					</div>
				</div>

				<div class="flex gap-5">
					<div class="flex flex-col gap-2">
						<h2>Authors</h2>
						<div class="flex gap-2">
							<div class="chip" v-for="author in book?.authors">{{ author }}</div>
						</div>
					</div>

					<div class="flex flex-col gap-2">
						<h2>Artists</h2>
						<div class="flex gap-2">
							<div class="chip" v-for="artist in book?.artists">{{ artist }}</div>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<h2>Chapters</h2>

				<div class="flex gap-2" v-for="chapter in book?.chapters" @click="read(chapter.id)">
					<div
						class="bg-(--surface-container-low) rounded-md text-(--text-secondary) flex-1 p-2"
					>
						<div class="flex w-full justify-between">
							<div class="flex flex-col gap-2">
								<div class="flex gap-1 items-center">
									<span
										:class="[
											'fi',
											`fi-${$t(`languages.${chapter.language}.fi-code`)}`,
										]"
									></span>
									<p>{{ chapter.name }}</p>
								</div>
								<div class="flex flex-col">
									<p>Vol. {{ chapter.volume }} Ch. {{ chapter.number }}</p>
								</div>
							</div>
						</div>
						<div class="flex gap-2 items-center">
							<UserAvatarComponent
								:id="chapter.author.id"
								class="w-6 h-6 rounded-full"
							/>
							<p>@{{ chapter.author.username }}</p>
						</div>
					</div>
					<button class="secondary">
						<span class="pi pi-book"></span>
					</button>
				</div>
			</div>
		</div>
	</template>

	<ClientOnly>
		<Teleport to="body" v-if="book">
			<CreateBookCharapterModal
				:show="showCChapterModal"
				:book-id="book.id"
				@close="showCChapterModal = false"
			/>
		</Teleport>
		<Teleport to="body" v-if="book">
			<SaveBookModal
				:show="showSaveModal"
				:book="book"
				:book-cover="primaryCover"
				@close="showSaveModal = false"
			/>
		</Teleport>
	</ClientOnly>
</template>
