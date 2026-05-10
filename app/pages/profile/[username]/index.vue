<script lang="ts" setup>
import UserBannerComponent from '~/components/kit/UserBannerComponent.vue';
import Error from '~/error.vue';
import type { UsersProfileResponse } from '~~/shared/schemas';

const route = useRoute();
const username = computed(() => route.params.username as string);

const isValid = computed(() => {
	const name = username.value;
	return !!name && /^[a-zA-Z0-9_\u0400-\u04FF]+$/.test(name);
});

const isMyself = computed(() => {
	return user.value?.username == username.value;
});

const {
	data: profile,
	status,
	error,
} = await useLazyFetch<UsersProfileResponse>(`/api/users/${username.value}/profile`, {
	immediate: isValid.value,
	watch: [username],
	headers: {
		Accept: 'application/json',
	},
	onResponse({ response }) {
		const isJson = response.headers.get('content-type')?.includes('application/json');
		if (!isJson) {
			throw createError({
				statusCode: 415,
				fatal: false,
			});
		}
	},
});

const { user } = useUser();

const showProfileSettings = ref(false);

const formatSeconds = (seconds: number): string => {
	const duration = {
		years: Math.floor(seconds / 31536000),
		days: Math.floor((seconds % 31536000) / 86400),
		hours: Math.floor((seconds % 86400) / 3600),
		minutes: Math.floor((seconds % 3600) / 60),
		seconds: seconds % 60,
	};

	const formatted = new (Intl as any).DurationFormat('en', {
		style: 'narrow',
	}).format(duration);
	return formatted;
};
const ttw = computed(() => {
	if (!profile.value || !profile.value.ttw) return '0';

	return formatSeconds(profile.value.ttw);
});
</script>
<template>
	<Error
		v-if="error || status == 'idle'"
		:error="
			createError({
				statusCode: 404,
				statusMessage: 'User not found',
				fatal: false,
			})
		"
	/>
	<template v-else>
		<div class="flex flex-col gap-2 relative" :class="{ 'is-loading': status == 'pending' }">
			<UserBannerComponent
				v-if="profile"
				class="rounded-md h-36 md:h-56 object-cover"
				:id="profile.id"
			/>

			<div class="flex gap-2 break-all">
				<UserAvatarComponent
					v-if="profile"
					:id="profile.id"
					class="w-26 h-26 md:w-56 md:h-56 -mt-12 rounded-md border-2 border-(--surface)"
				/>
				<p>{{ profile?.bio }}</p>
			</div>
			<div class="flex flex-col gap-2 w-full">
				<div class="flex flex-col">
					<p class="font-bold">{{ profile?.display_name }}</p>
					<p>@{{ profile?.username }}</p>
				</div>

				<div class="flex justify-between items-center flex-1">
					<div class="flex flex-col self-end">
						<p>ttw</p>
						<p class="font-bold text-(--primary) text-lg">{{ ttw }}</p>
					</div>
					<div class="flex flex-col self-end">
						<p>Liked books</p>
						<p class="font-bold text-(--primary) text-lg">{{ profile?.likes }}</p>
					</div>

					<div class="flex">
						<MenuComponent name="book-more" :stretch="true">
							<template #activator>
								<button class="relative h-12">
									<span class="pi pi-ellipsis-h"></span>
								</button>
							</template>
							<template #list>
								<p v-if="isMyself" @click="showProfileSettings = true">
									Profile settings
								</p>
							</template>
						</MenuComponent>
					</div>
				</div>
			</div>
		</div>
		<hr />

		<template v-if="profile?.compatibility != undefined">
			<div class="flex gap-2 relative">
				<svg
					class="h-12 w-12"
					viewBox="0 0 191 160"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<defs>
						<linearGradient id="fill" x1="0" x2="0" y1="1" y2="0">
							<stop offset="0%" stop-color="var(--on-primary-container)" />
							<stop
								:offset="`${profile.compatibility.value}%`"
								stop-color="var(--on-primary-container)"
							/>

							<stop
								:offset="`${profile.compatibility.value}%`"
								stop-color="var(--primary-container)"
							/>
							<stop offset="100%" stop-color="var(--primary-container)" />
						</linearGradient>
					</defs>

					<path
						d="M171 71.0584C118 130.058 93.0002 149.625 93.0002 149.625C93.0002 149.625 67.6901 130.661 14.0324 70.9286C-11.2355 42.8001 0.114487 3.33754 37.8239 0.566363C63.7981 -1.34242 93.0002 38.5586 93.0002 38.5586C93.0002 38.5586 121.845 -0.326759 147.5 1.55863C184.748 4.29584 195.958 43.2747 171 71.0584Z"
						fill="url(#fill)"
					/>
				</svg>
				<div class="flex flex-col">
					<p>
						<span class="font-bold">{{ profile.compatibility.value }}</span
						>%
					</p>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<div
					v-for="book in profile.compatibility.books"
					class="flex gap-2 primary-container"
				>
					<BookCoverComponent class="cover-xs" :book-id="book.id" :id="book.coverId" />
					<div class="flex flex-col">
						<p class="font-bold">{{ book.title }}</p>
						<p>
							{{ profile.username }} spent
							{{ formatSeconds(book.targetTime) }}
						</p>
						<p>u {{ formatSeconds(book.myTime) }}</p>
					</div>
				</div>
			</div>
			<hr />
		</template>

		<div class="flex gap-2 flex-wrap">
			<NuxtLink
				v-for="shelf in profile?.shelves"
				:to="`/profile/${profile?.username}/shelves/${shelf.id}`"
			>
				<ShelfCoverComponent
					v-if="profile"
					class="cover-md"
					:user-id="profile.id"
					:id="shelf.id"
					:type="shelf.type"
				/>
			</NuxtLink>
		</div>
	</template>

	<Teleport to="body">
		<ProfileSettingsModal :show="showProfileSettings" @close="showProfileSettings = false" />
	</Teleport>
</template>
