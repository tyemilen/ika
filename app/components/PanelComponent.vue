<script lang="ts" setup>
import { onMounted, Transition, useTemplateRef, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import { usePanel } from '@/composables/usePanel';
import { onClickOutside, useScrollLock, useSwipe } from '@vueuse/core';

const { user, logout } = useUser();

const router = useRouter();

const panel = useTemplateRef('panel');
const { isOpen, close } = usePanel();

const goToPage = (path: string) => {
	close();
	router.push(path);
};

const panelCloseSwipeArea = useTemplateRef('panelCloseSwipeArea');

onMounted(() => {
	const isLocked = useScrollLock(document.body);

	watchEffect(() => (isLocked.value = isOpen.value));
	onClickOutside(panel, () => close());

	useSwipe(panelCloseSwipeArea.value, {
		threshold: 30,
		onSwipeEnd(_, direction) {
			if (direction != 'right') return;

			close();
		},
	});
});
</script>
<template>
	<Transition name="drawer">
		<div
			class="fixed top-0 left-0 z-102 bg-black/20 w-full h-full pointer-events-auto"
			v-show="isOpen"
			ref="panelCloseSwipeArea"
		>
			<div
				class="panel absolute right-0 w-1/2 h-full flex flex-col gap-4 bg-(--surface) p-2"
				ref="panel"
			>
				<button @click="goToPage('/')">Home</button>
				<button @click="goToPage(`/profile/${user?.username}`)">
					{{ user?.username }}
				</button>

				<div class="flex flex-col gap-2">
					<div class="flex gap-2 items-center">
						<span class="pi pi-book"></span>
						<p>Books</p>
					</div>
					<button @click="goToPage('/search')">Search</button>
					<button @click="goToPage('/books/latest')">Latest</button>
					<button @click="goToPage('/books/random')">Random</button>
					<button @click="goToPage('/create/book')">Create a book draft</button>
					<button @click="goToPage('/my/books')">My books</button>
					<button @click="goToPage('/my/library')">My library</button>
					<button @click="goToPage('/my/history')">My history</button>
				</div>
				<div
					class="flex flex-col gap-2"
					v-if="user?.role == 'moderator' || user?.role == 'admin'"
				>
					<div class="flex gap-2 items-center">
						<span class="pi pi-heart-fill"></span>
						<p>for special boys</p>
					</div>
					<button @click="goToPage('/special/queue')">Submit queue</button>
				</div>
				<div class="w-full h-full flex items-end">
					<button class="w-full" @click="logout">logout</button>
				</div>
			</div>
		</div>
	</Transition>
</template>
<style lang="css" scoped>
.drawer-enter-active,
.drawer-leave-active {
	transition: opacity 0.2s ease;
}

.drawer-enter-from,
.drawer-leave-to {
	opacity: 0;
}

.drawer-enter-active .panel,
.drawer-leave-active .panel {
	transition: transform 0.2s ease-out;
}

.drawer-enter-from .panel,
.drawer-leave-to .panel {
	transform: translateX(100%);
}
</style>
