<script setup lang="ts">
definePageMeta({
	layout: 'empty',
});

import { useSwipe, useIntersectionObserver, watchDebounced } from '@vueuse/core';
import { UseTimeAgo } from '@vueuse/components';

import constants from '~~/shared/constants';
import {
	MyHistoryPostBodySchema,
	type BasePageCommentResponse,
	type MyHistoryPostBody,
} from '~~/shared/schemas';

const router = useRouter();
const route = useRoute();

const [bookId, chapterId, page] = route.params.slug as unknown as string[];

const { data: chapter, status } = useLazyFetch(`/api/books/${bookId}/chapter/${chapterId}`);

const active = ref(Number(page) - 1);
const reader = useTemplateRef<HTMLElement>('reader');

const gateway = useGateway();

watchEffect(() => {
	if (chapter.value?.book) {
		gateway.startReading(chapter.value.book.name);
	}
	if (page == 'last' && chapter.value) {
		active.value = chapter.value.pages.length - 1;
	}
});

const comments = ref<BasePageCommentResponse[]>([]);

const pages = computed<string[]>(() => {
	if (!chapter.value) return [];
	return chapter.value.pages;
});

let currentAbortController: AbortController | null = null;
const pendingComments = ref(false);
const lastPageComments = ref<string | null>(null);

const fetchComments = async () => {
	const page = pages.value[active.value];
	if (!page) return;
	if (page == lastPageComments.value) return;

	if (currentAbortController) currentAbortController.abort('race');
	currentAbortController = new AbortController();

	try {
		pendingComments.value = true;
		comments.value = [];
		const pageComments = await $fetch(`/api/pages/${page}/comments`, {
			signal: currentAbortController.signal,
			onRequest() {
				pendingComments.value = true;
			},
		});
		comments.value = pageComments;
		lastPageComments.value = page;
	} catch (err: any) {
		if (err.name === 'AbortError') return;
	} finally {
		if (!currentAbortController.signal.aborted) {
			pendingComments.value = false;
		}
	}
};

const commentInputRef = useTemplateRef('commentInput');
const { notify } = useNotifications();
const { user } = useUser();

const sendComment = async () => {
	if (!user.value || !commentInputRef.value) return;

	const comment = commentInputRef.value.value;
	const page = pages.value[active.value];

	if (!page) return;
	if (!comment.length || comment.length > constants.MAX_COMMENT_LENGTH) {
		notify({
			type: 'error',
			text: `Max comment length is ${constants.MAX_COMMENT_LENGTH}`,
		});
		return;
	}

	commentInputRef.value.value = '';

	comments.value.unshift({
		userId: user.value.id,
		displayName: user.value.displayName,
		username: user.value.username,
		text: comment,
		createdAt: new Date().getTime(),
	});

	await $fetchNotify(`/api/pages/${page}/comment`, {
		method: 'POST',
		body: { text: comment },
	});
};

const noChaptersPopup = ref(false);

let lastResumeTime = Date.now();
let totalActiveMs = 0;
let timeAlreadySynced = 0;
let isSyncing = false;

const calculateCurrentTotalSeconds = () => {
	let sessionMs = totalActiveMs;
	if (document.visibilityState === 'visible') {
		sessionMs += Date.now() - lastResumeTime;
	}
	return Math.floor(sessionMs / 1000);
};

const sendAnalytics = async () => {
	if (isSyncing || !bookId || !chapterId) return;

	const pageId = chapter.value?.pages[active.value];
	if (!pageId) return;

	const totalSessionSeconds = calculateCurrentTotalSeconds();
	const timeSpent = totalSessionSeconds - timeAlreadySynced;

	if (timeSpent <= 0) return;

	const data: MyHistoryPostBody = {
		bookId,
		chapterId,
		pageId,
		timeSpent,
	};

	const result = MyHistoryPostBodySchema.safeParse(data);
	if (!result.success) return;

	isSyncing = true;
	const previousSyncedValue = timeAlreadySynced;
	timeAlreadySynced = totalSessionSeconds;

	try {
		await $fetch('/api/users/@me/history', {
			method: 'POST',
			body: result.data,
			keepalive: true,
		});
	} catch (err) {
		timeAlreadySynced = previousSyncedValue;
		console.error('Failed to sync history:', err);
	} finally {
		isSyncing = false;
	}
};

const handleVisibilityChange = () => {
	if (document.visibilityState === 'hidden') {
		totalActiveMs += Date.now() - lastResumeTime;
		sendAnalytics();
	} else {
		lastResumeTime = Date.now();
	}
};

const historyInterval = setInterval(sendAnalytics, constants.MAX_READING_INTERVAL_UPDATE);

const goToPage = (pageIndex: number) => {
	if (!pages.value) return;

	if (pageIndex < 0) {
		if (chapter.value?.prev) {
			router.push(`/reader/${bookId}/${chapter.value.prev.id}/last`);
		}
		return;
	}
	if (pageIndex >= pages.value.length) {
		if (chapter.value?.next) {
			router.push(`/reader/${bookId}/${chapter.value.next.id}/1`);
			return;
		}
		noChaptersPopup.value = true;
		return;
	}

	active.value = pageIndex;
	const newPath = `/reader/${bookId}/${chapterId}/${active.value + 1}`;
	window.history.replaceState(window.history.state, '', newPath);
};

const pageRef = useTemplateRef('pageRef');
const commentSection = useTemplateRef<HTMLElement>('commentSection');
const isVisible = ref(false);

useIntersectionObserver(commentSection, (entries) => {
	const entry = entries[0];
	if (entry) {
		isVisible.value = entry.isIntersecting && entry.intersectionRatio >= 0;
	}
});

watchDebounced(
	[active, pages, isVisible],
	() => {
		if (isVisible.value) fetchComments();
	},
	{ debounce: 300, immediate: true },
);

onMounted(async () => {
	setTimeout(() => {
		if (!pageRef.value) return;
		pageRef.value.scrollIntoView({ block: 'end' });
	}, 10);

	window.addEventListener('visibilitychange', handleVisibilityChange);
	window.addEventListener('pagehide', handleVisibilityChange);

	useSwipe(reader.value, {
		threshold: 10,
		onSwipeEnd(_, direction) {
			if (direction == 'left') {
				goToPage(active.value + 1);
			} else if (direction == 'right') {
				goToPage(active.value - 1);
			}
		},
	});
});

onUnmounted(() => {
	clearInterval(historyInterval);
	window.removeEventListener('visibilitychange', handleVisibilityChange);
	window.removeEventListener('pagehide', handleVisibilityChange);
	gateway.stopReading();
});

onBeforeRouteLeave(async () => {
	await sendAnalytics();
});
</script>
<template>
	<div class="flex flex-col gap-4">
		<HeaderComponent :fixed="false" :main-ref="null" />
		<div class="w-full flex flex-col justify-center items-center">
			<h2>{{ chapter?.chapter.name }}</h2>
			<p>{{ chapter?.book.name }}</p>
			<div class="flex gap-2">
				<div class="chip">
					Vol. {{ chapter?.chapter.volume }}, Ch. {{ chapter?.chapter.number }}
				</div>
				<div>Pg {{ active + 1 }} / {{ pages?.length }}</div>
			</div>
		</div>
		<div
			class="w-screen h-sscreen flex flex-col relative items-center justify-center bg-(--bg-reader)"
			ref="pageRef"
		>
			<div class="h-full relative flex items-center justify-center" ref="reader">
				<div class="w-screen h-full absolute flex justify-between">
					<div class="w-1/2 h-full" @click="goToPage(active - 1)"></div>
					<div class="w-1/2 h-full" @click="goToPage(active + 1)"></div>
				</div>
				<NuxtImg
					v-for="(page, index) in pages"
					provider="pages"
					class="contain max-w-full max-h-full relative select-none"
					:class="{ hidden: index != active }"
					:src="`${chapterId}/${page}`"
				/>
				<div class="w-full h-full absolute flex justify-between pointer-events-none">
					<div
						class="w-3/8 h-full pointer-events-auto"
						@click="goToPage(active - 1)"
					></div>
					<div
						class="w-3/8 h-full pointer-events-auto"
						@click="goToPage(active + 1)"
					></div>
				</div>
				<div
					v-if="status == 'pending'"
					class="absolute w-screen h-screen bg-(--bg-primary) flex justify-center items-center"
				>
					<div class="spinner w-12! h-12!"></div>
				</div>
			</div>

			<div class="fixed bottom-0 w-full h-[4px] flex gap-px opacity-50 hover:h-6">
				<div
					v-for="index in pages?.length"
					class="w-full h-full cursor-pointer"
					:style="{
						background:
							index - 1 == active ? 'var(--color-primary)' : 'var(--color-secondary)',
					}"
					@click="active = index - 1"
				></div>
			</div>
		</div>
		<div class="h-full break-all w-[95%] md:w-[70%] centered flex flex-col gap-4 pb-5">
			<hr />
			<form class="flex gap-1" @submit.prevent="sendComment" ref="commentSection">
				<input type="text" class="flex-1" ref="commentInput" />
				<button type="submit">
					<span class="pi pi-angle-right"></span>
				</button>
			</form>
			<div class="pt-5 pb-5 w-full flex justify-center items-center" v-if="pendingComments">
				<div class="spinner"></div>
			</div>
			<div v-for="comment in comments" class="flex w-full gap-2">
				<UserAvatarComponent class="w-12 h-12 rounded-full" :id="comment.userId" />
				<div class="flex flex-col w-full">
					<div class="flex justify-between items-center w-full">
						<div class="flex flex-col">
							<p class="font-bold">{{ comment.displayName }}</p>
							<p class="text-xs opacity-50">@{{ comment.username }}</p>
						</div>
						<UseTimeAgo
							v-if="comment.createdAt"
							v-slot="{ timeAgo }"
							:time="comment.createdAt"
						>
							<p class="text-xs">{{ timeAgo }}</p>
						</UseTimeAgo>
					</div>
					<p>{{ comment.text }}</p>
				</div>
			</div>
		</div>
	</div>
	<Transition name="fade">
		<div
			v-show="noChaptersPopup"
			class="fixed bg-(--bg-overlay) z-999 w-screen h-screen top-0 left-0 flex justify-center items-center"
		>
			<div class="bg-(--bg-primary) p-2 rounded-md flex flex-col items-center gap-4">
				<p>no more chapters sorry man</p>
				<RouterLink v-if="chapter?.book" :to="`/books/${chapter.book.slug}`">
					<button>Go home</button>
				</RouterLink>
			</div>
		</div>
	</Transition>
</template>
