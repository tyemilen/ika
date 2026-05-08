<script lang="ts" setup>
import { useMenu } from '@/composables/useMenu';
import { onClickOutside } from '@vueuse/core';

const { name, stretch = false } = defineProps<{
	name: string;
	stretch?: boolean;
}>();

const menu = useMenu();

menu.register(name);

const isOpen = computed(() => menu.isOpen(name));

const menuRef = useTemplateRef('menuRef');
const activRef = useTemplateRef('activRef');

onClickOutside(menuRef, () => menu.close(name), {
	ignore: [activRef],
});

const menuStyle = ref<{ left?: string; right?: string }>({ left: '0px' });
watch(isOpen, async (open) => {
	await nextTick();
	if (!open || !activRef.value) return;

	const triggerRect = activRef.value.getBoundingClientRect();
	const viewportWidth = window.innerWidth;

	if (triggerRect.left > viewportWidth / 2) {
		menuStyle.value = {
			right: '0px',
			left: 'auto',
		};
	} else {
		menuStyle.value = {
			left: '0px',
			right: 'auto',
		};
	}
});
</script>
<template>
	<div class="relative flex" :class="{ 'h-fit': !stretch }">
		<div @click="menu.toggle(name)" ref="activRef">
			<slot name="activator" />
		</div>
		<Transition name="fade-down">
			<div
				class="flex flex-col bg-(--surface-container-lowest) absolute top-[110%] whitespace-nowrap rounded-sm menu z-10"
				:style="menuStyle"
				ref="menuRef"
				v-if="isOpen"
				@click="menu.close(name)"
			>
				<slot name="list" />
			</div>
		</Transition>
	</div>
</template>
<style lang="scss" scoped>
.menu {
	box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
}

.menu * {
	padding: 0.7em;
	padding-left: 1em;
	padding-right: 1em;
	user-select: none;
	cursor: pointer;

	&:hover {
		background-color: var(--bg-secondary);
	}
	&:not(:last-child) {
		border-bottom: 1px solid var(--bg-darker-secondary);
	}
}
</style>
