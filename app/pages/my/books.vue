<script lang="ts" setup>
const { data: drafts, status } = useLazyFetch('/api/books/drafts');

const publishBook = async (index: number) => {
	const book = drafts.value?.[index];

	if (!book) return;

	const resp = await $fetchNotify(`/api/books/drafts/${book.id}/publish`, {
		method: 'PATCH',
	});

	drafts.value![index]!.status = 'queue';
};

const config = useRuntimeConfig();
</script>
<template>
	<div
		class="flex flex-col gap-4 justify-center w-full pb-5"
		:class="{ 'is-loading': status == 'pending' }"
	>
		<h2>Your cool ass books</h2>

		<div v-for="(draft, index) in drafts" class="flex w-full gap-4">
			<div
				class="cover-xs bg-cover shrink-0"
				:style="{
					backgroundImage: `url(${config.public.coversCdnBase}/${draft.id}/${draft.covers[0]!.id})`,
				}"
			></div>
			<div class="flex flex-1 flex-col gap-2">
				<div class="flex justify-between items-center break-all">
					<div class="flex flex-col gap-2">
						<span
							:class="[
								'fi',
								`fi-${$t(`languages.${draft.titles[0]!.language}.fi-code`)}`,
							]"
						></span>
						<p class="font-bold">{{ draft.titles[0]!.content }}</p>
						<p class="font-mono">{{ draft.status }}</p>
					</div>
					<MenuComponent :name="`draft-actions-${draft.id}`">
						<template #activator>
							<div
								class="relative w-6 h-6 p-4 flex justify-center rounded-full items-center"
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
