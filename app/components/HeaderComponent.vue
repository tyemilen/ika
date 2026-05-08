<script setup lang="ts">
import type { BookDocument } from '~~/shared/meilisearch';
import SquidIcon from './icons/SquidIcon.vue';

const { loggedIn } = useUserSession();

const { fixed = true, mainRef } = defineProps<{
	fixed?: boolean;
	mainRef: HTMLDivElement | null;
}>();

const panel = usePanel();
const isScrolled = ref(false);

const handleScroll = (ev: Event) => {
	const target = ev.target as HTMLElement;
	isScrolled.value = target.scrollTop > 20;
};

watch(
	() => mainRef,
	(newEl, oldEl) => {
		if (oldEl) {
			oldEl.removeEventListener('scroll', handleScroll);
		}
		if (newEl) {
			newEl.addEventListener('scroll', handleScroll);
		}
	},
	{ immediate: true },
);
onMounted(() => {
	window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
	if (mainRef) {
		mainRef.removeEventListener('scroll', handleScroll);
	}
	window.removeEventListener('scroll', handleScroll);
});

const showLogin = ref(false);

const search = ref('');
const searching = ref(false);
const searchResult = ref<BookDocument[]>([]);

watchDebounced(
	search,
	async (query) => {
		if (!query.length) {
			searchResult.value = [];
			return;
		}

		searchResult.value = [];
		searching.value = true;

		const result = await $fetch('/api/books/search', {
			params: {
				q: query,
			},
		});

		searching.value = false;
		searchResult.value = result;
	},
	{
		debounce: 300,
	},
);

const searchInputRef = useTemplateRef('searchInput');

onClickOutside(searchInputRef, () => {
	searchResult.value = [];
});
</script>
<template>
	<div
		class="w-full shrink-0 flex justify-center z-100 transition-[background-color,opacity] h-(--header-height) top-0 left-0 right-0"
		:class="{ 'header-active': isScrolled && fixed, fixed: fixed }"
	>
		<div class="h-full flex justify-between items-center gap-5 header w-[95%] md:w-[70%]">
			<RouterLink to="/">
				<SquidIcon class="w-12 h-12" />
			</RouterLink>
			<div class="relative w-full">
				<input type="text" class="w-full" v-model="search" />

				<div
					class="absolute w-full p-2 bg-(--bg-primary) shadow-lg top-[110%] flex flex-col justify-center items-center gap-2 rounded-md"
					ref="searchInput"
					v-if="searching || searchResult.length"
				>
					<div v-if="searching" class="spinner"></div>
					<div v-for="book in searchResult" class="flex gap-2 w-full">
						<div class="cover-xs">
							<BookCoverComponent :book-id="book.primaryKey" :id="book.coverId" />
						</div>
						<div class="flex flex-col">
							<p>{{ book.title }}</p>
						</div>
					</div>
				</div>
			</div>
			<div class="flex gap-2">
				<div
					v-if="loggedIn"
					class="w-12 h-12 cursor-pointer bg-(--bg-primary)/50 rounded-full flex items-center justify-center backdrop-blur-xs"
					@click="panel.open()"
				>
					<span class="pi pi-bars"></span>
				</div>
				<button v-else @click="showLogin = true">login</button>
			</div>
		</div>
	</div>
	<Teleport to="body">
		<LoginModal :show="showLogin" @close="showLogin = false" />
	</Teleport>
</template>
<style lang="scss" scoped>
@use '@/assets/scss/mixins' as *;

.header-active {
	background-color: var(--surface);
	box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2);
}
</style>
