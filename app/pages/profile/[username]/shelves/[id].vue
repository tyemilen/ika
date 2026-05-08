<script lang="ts" setup>
import type { LibraryShelfResponse } from '~~/shared/schemas';

const route = useRoute();
const id = computed(() => route.params.id as string);

const { data: shelf, status } = useLazyFetch<LibraryShelfResponse>(`/api/library/${id.value}`);
</script>
<template>
	<div
		class="flex flex-col gap-4 self-start w-[95%] md:w-[70%] centered"
		:class="{ 'is-loading': status == 'pending' }"
	>
		<div class="flex flex-col gap-2">
			<h3>{{ shelf?.name }}</h3>
			<div class="flex gap-2">
				<div class="w-6 h-6 rounded-full flex items-center">
					<UserAvatarComponent
						v-if="shelf"
						class="rounded-full w-6 h-6"
						:id="shelf.owner.id"
					/>
				</div>
				<p>{{ shelf?.owner.username }}</p>
			</div>
		</div>

		<hr />

		<div class="flex gap-2" v-for="book in shelf?.books">
			<div class="cover-md">
				<NuxtImg provider="covers" :src="`${book.id}/${book.cover}`" />
			</div>
			<p>{{ book.title }}</p>
		</div>
	</div>
</template>
