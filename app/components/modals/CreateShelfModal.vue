<script setup lang="ts">
import { onClickOutside, useScrollLock } from '@vueuse/core';
import { useTemplateRef, watchEffect } from 'vue';
import { LibraryShelfPostBodySchema, type LibraryShelfPostBody } from '~~/shared/schemas';

const { show } = defineProps<{
	show: boolean;
}>();
const emit = defineEmits<{
	close: [];
}>();

const shelfData = ref<Partial<LibraryShelfPostBody>>({
	name: undefined,
	cover: undefined,
});

const coverPreview = ref('');
const onCoverChange = (event: Event) => {
	const file = (event.target as HTMLInputElement).files?.[0];

	if (file) {
		coverPreview.value = URL.createObjectURL(file);
		shelfData.value.cover = file;
	}
};

const { notify } = useNotifications();

const createShelf = () => {
	const result = LibraryShelfPostBodySchema.safeParse(shelfData.value);

	if (result.error) {
		const { message } = result.error.issues[0]!;
		return notify({ type: 'error', text: `${message}` });
	}

	const formData = new FormData();

	formData.append('name', result.data.name);

	if (result.data.cover) {
		formData.append('cover', result.data.cover);
	}

	$fetchNotify('/api/library/shelf', {
		method: 'POST',
		body: formData,
	});
};
onMounted(() => {
	const isLocked = useScrollLock(document.body);

	watchEffect(() => (isLocked.value = show));

	const dialog = useTemplateRef<HTMLDivElement>('dialog');
	onClickOutside(dialog, () => emit('close'), {
		ignore: ['.notification'],
	});
});
</script>
<template>
	<Transition name="modal">
		<div v-show="show" class="modal-container">
			<div class="modal w-[95%] h-auto" ref="dialog">
				<div class="modal-titlebar justify-start! gap-4">
					<button class="secondary" @click="emit('close')">
						<span class="pi pi-arrow-left"></span>
					</button>
					<div>New shelf</div>
				</div>
				<div
					class="cover-xl bg-cover"
					:style="{ 'background-image': `url(${coverPreview})` }"
				></div>
				<div class="flex flex-col gap-2">
					<label class="w-full p-2 bg-(--color-primary)">
						<p>Upload shelf cover</p>
						<input type="file" class="hidden" @change="onCoverChange" />
					</label>
					<input
						type="text"
						class="h-fit"
						placeholder="Shelf Name"
						v-model="shelfData.name"
					/>
					<button @click="createShelf">Create</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
