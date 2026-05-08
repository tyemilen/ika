<script setup lang="ts">
import { onClickOutside, useScrollLock } from '@vueuse/core';
import { useTemplateRef, watchEffect } from 'vue';

import type { BaseBookResponse, BaseShelfResponse } from '~~/shared/schemas';

const { show, book } = defineProps<{
	book: BaseBookResponse;
	bookCover: string;
	show: boolean;
}>();
const emit = defineEmits<{
	close: [];
}>();

const isLocked = useScrollLock(document.body);

watchEffect(() => (isLocked.value = show));

const dialog = useTemplateRef('dialog');
onClickOutside(dialog, () => emit('close'), {
	ignore: ['.notification'],
});

const { data: resLibraries, status } = useLazyFetch('/api/library');

const newShelf = ref(false);

const libraries = ref<Partial<BaseShelfResponse>[]>([
	{
		name: 'Create a new shelf',
	},
]);

watch(status, (newStatus) => {
	if (newStatus == 'success') {
		libraries.value = libraries.value.concat(resLibraries.value ?? []);
	}
});
</script>
<template>
	<Transition name="modal">
		<div v-show="show" class="modal-container" :class="{ 'is-loading': status == 'pending' }">
			<div class="modal w-[90%] h-[90%]" ref="dialog">
				<div class="modal-titlebar">
					<button class="secondary" @click="emit('close')">
						<span class="pi pi-arrow-left"></span>
					</button>
				</div>
				<div class="flex gap-2">
					<div class="cover-md">
						<NuxtImg provider="covers" :src="bookCover" />
					</div>
					<h2>{{ book.titles[0]?.content }}</h2>
				</div>
				<div class="flex flex-col gap-4">
					<SelectComponent :options="libraries" placeholder="Shelves">
						<template #item="{ option, select }">
							<div
								@click="
									() => {
										select();
										if (option.id && newShelf) newShelf = false;
										if (!option.id) {
											newShelf = true;
										}
									}
								"
								class="p-2 flex items-center gap-2"
							>
								<p>{{ option.name }}</p>
							</div>
						</template>
						<template #selected="{ option }">
							<p>{{ option.name }}</p>
						</template>
					</SelectComponent>
					<div class="flex flex-col" v-if="newShelf">
						<input type="text" placeholder="New shelf name" />
					</div>
					<button>Add</button>
					<button class="secondary" @click="emit('close')">Cancel</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
