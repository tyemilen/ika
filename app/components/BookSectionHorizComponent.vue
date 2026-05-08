<script lang="ts" setup>
import { VueLenis } from 'lenis/vue';

defineProps<{
	title?: string;
	bigCover?: boolean;
}>();
const lenisRef = ref();
const scrollLeft = ref(0);

const goLeft = (mult = 0.7) => {
	const lenis = lenisRef.value?.lenis;

	if (!lenis) return;

	lenis.scrollTo(lenis.scroll - window.innerWidth * mult, { lerp: 0.1 });
};

const goRight = (mult = 0.7) => {
	const lenis = lenisRef.value?.lenis;
	if (!lenis) return;

	lenis.scrollTo(lenis.scroll + window.innerWidth * mult, { lerp: 0.1 });
};

const options = {
	orientation: 'horizontal',
	gestureOrientation: 'horizontal',
	smoothWheel: true,
	lerp: 0.1,
	wheelMultiplier: 1,
	syncTouchLerp: 0.075,
	touchInertiaExponent: 1.7,
	touchMultiplier: 1.5,
	syncTouch: true,
	autoRaf: true,
	easing: (t: number) => 1 - Math.pow(1 - t, 2),
} as const;

const handleScroll = (e: any) => {
	scrollLeft.value = e.target.scrollLeft;
};
</script>
<template>
	<div class="w-full relative">
		<VueLenis
			ref="lenisRef"
			:options="options"
			@scroll="handleScroll"
			class="w-full overflow-hidden"
			data-lenis-prevent-vertical
		>
			<div class="flex gap-2">
				<div class="flex flex-col gap-0.5 shrink-0" v-for="i in 90" :key="i">
					<div class="cover-xl"></div>
					<div class="font-medium">cool title {{ i }}</div>
					<div class="text-sm opacity-50">type</div>
				</div>
			</div>
		</VueLenis>
		<div
			class="w-full h-full absolute flex justify-between items-center pointer-events-none pr-2 pl-2 top-0 left-0"
		>
			<div @click="goLeft()" class="nav" :class="{ hidden: scrollLeft <= 10 }">
				<span class="pi pi-angle-left"></span>
			</div>
			<div @click="goRight()" class="nav">
				<span class="pi pi-angle-right"></span>
			</div>
		</div>
	</div>
</template>
<style lang="scss" scoped>
.nav {
	width: 3rem;
	height: 3rem;
	color: var(--text-primary);
	background: var(--bg-primary);
	display: flex;
	justify-content: center;
	align-items: center;
	border-radius: 100px;
	box-shadow: 0px 5px 10px rgba(0, 0, 0, 0.2);
	cursor: pointer;
	pointer-events: all;
	transition: all 0.1s;

	&.hidden {
		opacity: 0;
	}

	&:active {
		transform: scale(0.95);
	}
}
</style>
