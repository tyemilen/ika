<script setup lang="ts" generic="T">
import { onClickOutside } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

const props = defineProps<{
	placeholder?: string;
	canBeNone?: boolean;
	stretch?: boolean;
	options: readonly T[];
}>();

const value = defineModel<number>('value', { default: -1 });

const emit = defineEmits<{
	(e: 'change', i: number): void;
}>();

const showOptions = ref(false);

const select = (index: number) => {
	showOptions.value = false;

	console.log('choose', index);
	value.value = index;
	emit('change', index);
};

const optionsRef = useTemplateRef('optionsRef');
const selectRef = useTemplateRef('selectRef');

onClickOutside(optionsRef, () => (showOptions.value = false), {
	ignore: [selectRef],
});
</script>
<template>
	<div class="select" ref="selectRef" @click="showOptions = !showOptions">
		<div class="placeholder">
			<template v-if="value !== -1">
				<slot name="selected" :option="options[value]!" :index="value">
					<p>{{ options[value] }}</p>
				</slot>
			</template>
			<p v-else data-placeholder>{{ placeholder }}</p>

			<i class="pi pi-angle-down" :class="{ active: showOptions }"></i>
		</div>
		<Transition name="fade-down">
			<div
				class="options"
				:class="{ 'w-full': !stretch }"
				v-if="showOptions"
				ref="optionsRef"
			>
				<p v-if="value != -1 && canBeNone" @click.stop="select(-1)">None</p>

				<template v-for="(opt, i) in options" :key="i">
					<div @click.stop>
						<slot name="item" :option="opt" :index="i" :select="() => select(i)">
							<p @click="select(i)">{{ opt }}</p>
						</slot>
					</div>
				</template>
			</div>
		</Transition>
	</div>
</template>
<style lang="scss" scoped>
.select {
	position: relative;
	overflow: visible;
	// border: 1px solid var(--outline);
	border-radius: var(--border-radius);
	padding: 0.5em;
	cursor: pointer;
	user-select: none;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background-color: var(--surface-dim);

	.placeholder {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5em;
		width: 100%;

		p[data-placeholder] {
			opacity: 0.4;
		}

		i {
			width: fit-content;
			height: fit-content;
			opacity: 0.5;
			transition: 0.1s;

			&.active {
				transform: rotate(180deg);
			}
		}
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
		max-height: calc(100% * 5);
		overflow-y: scroll;
		height: fit-content;
		position: absolute;
		left: 0;
		top: 120%;
		background-color: var(--surface-container-low);
		border-radius: var(--border-radius);
		z-index: 99;
		box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
		padding-top: 0.5em;
		padding-bottom: 0.5em;

		p {
			padding: 0.5em;
		}

		*:hover {
			background-color: var(--surface-container);
		}
	}
}
</style>
