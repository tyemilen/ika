<script setup lang="ts">
definePageMeta({
	middleware: ['protected'],
	allowed: ['admin', 'moderator'],
});

const { data: books, status } = useLazyFetch('/api/special/drafts');

const publishBook = async (index: number) => {
	const book = books.value?.[index];

	if (!book) return;

	const resp = await $fetchNotify(`/api/special/drafts/${book.id}/publish`, {
		method: 'PATCH',
	});

	books.value![index]!.status = 'published';
};
</script>
<template>
	<div
		class="flex flex-col gap-4 justify-center w-[95%] md:w-[70%] centered pb-5"
		:class="{ 'is-loading': status == 'pending' }"
	>
		<h2>Cool ass books</h2>

		<div v-for="(draft, index) in books" class="flex w-full gap-2">
			<div
				class="cover-xs bg-cover shrink-0"
				:style="{
					backgroundImage: `url(http://localhost:8333/book-covers/${draft.id}/${draft.covers[0]!.id})`,
				}"
			></div>
			<div class="flex flex-1 flex-col gap-2">
				<div class="flex justify-between items-center gap-2">
					<div class="flex gap-2">
						<span
							:class="[
								'fi',
								`fi-${$t(`languages.${draft.titles[0]!.language}.fi-code`)}`,
							]"
						></span>
						<p class="font-bold">{{ draft.titles[0]!.content }}</p>
						<p class="font-mono">{{ draft.status }}</p>
					</div>
					<MenuComponent :name="`draft-actions-${index}`">
						<template #activator>
							<div
								class="relative w-6 h-6 p-4 flex justify-center rounded-full items-center border border-(--text-placeholder)/20"
							>
								<span class="pi pi-ellipsis-v"></span>
							</div>
						</template>
						<template #list>
							<p>Edit</p>
							<p @click="publishBook(index)">Publish</p>
							<p class="text-red-500">Delete</p>
						</template>
					</MenuComponent>
				</div>

				<div class="flex flex-wrap gap-2">
					<div class="chip" v-for="genre in draft.genres">{{ genre }}</div>
				</div>

				<div class="flex flex-wrap gap-2">
					<div class="chip" v-for="theme in draft.themes">{{ theme }}</div>
				</div>
			</div>
		</div>
	</div>
</template>
