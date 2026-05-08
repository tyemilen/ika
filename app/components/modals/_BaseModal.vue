<script setup lang="ts">
import { onClickOutside, useScrollLock } from '@vueuse/core';
import { useTemplateRef, watchEffect } from 'vue';

const { show } = defineProps<{
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
</script>
<template>
	<Transition name="modal">
		<div v-show="show" class="modal-container">
			<div class="modal w-[90%] h-auto" ref="dialog">
				<div class="modal-titlebar">
					<button class="secondary" @click="emit('close')">
						<span class="pi pi-arrow-left"></span>
					</button>
				</div>
				<div class="flex flex-col gap-4"></div>
			</div>
		</div>
	</Transition>
</template>
