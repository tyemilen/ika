<script lang="ts" setup>
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
</script>
<template>
	<div v-if="error || status == 'idle'" class="overflow-hidden">
		<div class="h-16 w-full flex justify-center items-center">
			<p>404 not found</p>
		</div>
		<div class="absolute bottom-0 left-0 w-full">
			<TentaclesIcon class="w-full" />
		</div>
	</div>
	<template v-else-if="profile">
		<div class="flex flex-col gap-2">
			<NuxtImg provider="banners" :id="profile.id" />
			<div class="flex">
				<UserAvatarComponent :id="profile.id" class="w-26" />
				<div class="flex justify-between flex-1">
					<div class="flex flex-col">
						<p>ttw</p>
						<p class="font-bold text-(--primary) text-lg">22</p>
					</div>
					<div class="flex flex-col">
						<p>Following</p>
						<p class="font-bold text-(--primary) text-lg">22</p>
					</div>
					<div class="flex flex-col">
						<p>Followers</p>
						<p class="font-bold text-(--primary) text-lg">22</p>
					</div>

					<div class="flex items-center gap-2">
						<button>das</button>
						<button>das</button>
					</div>
				</div>
			</div>
		</div>
	</template>

	<Teleport to="body">
		<ProfileSettingsModal :show="showProfileSettings" @close="showProfileSettings = false" />
	</Teleport>
</template>
