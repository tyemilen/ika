<script setup lang="ts">
import { onClickOutside, useScrollLock } from '@vueuse/core';

const { user } = useUser();

const { show } = defineProps<{
	show: boolean;
}>();
const emit = defineEmits<{
	close: [];
}>();

const previews = reactive<Record<string, string | null>>({
	avatar: null,
	banner: null,
});

const onFileChange = (event: Event, type: 'avatar' | 'banner') => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		previews[type] = URL.createObjectURL(file);
	}
};

const formRef = useTemplateRef('formRef');
const handleUpload = async () => {
	if (!formRef.value) return;
	const formData = new FormData(formRef.value);
	for (const [key, value] of Array.from(formData.entries())) {
		const isFile = value instanceof File;

		if ((isFile && value.size === 0) || (!isFile && value === '')) {
			formData.delete(key);
		}
	}

	await $fetchNotify('/api/users/@me/profile', {
		method: 'PATCH',
		body: formData,
	});
};

onMounted(() => {
	const isLocked = useScrollLock(document.body);

	watchEffect(() => (isLocked.value = show));

	const dialog = useTemplateRef<HTMLDivElement>('dialog');
	onClickOutside(dialog, () => emit('close'));
});
onUnmounted(() => {
	if (previews.avatar) URL.revokeObjectURL(previews.avatar);
	if (previews.banner) URL.revokeObjectURL(previews.banner);
});

const config = useRuntimeConfig();
</script>
<template>
	<ClientOnly>
		<Transition name="modal">
			<div v-show="show" class="modal-container">
				<div class="modal w-full h-full rounded-none! pt-0!" ref="dialog">
					<div class="modal-titlebar absolute z-999 mt-2 left-2">
						<button class="secondary" @click="emit('close')">
							<span class="pi pi-arrow-left"></span>
						</button>
					</div>

					<form
						class="flex flex-col gap-2 w-full flex-1"
						ref="formRef"
						@submit.prevent="handleUpload"
					>
						<div class="h-32">
							<div
								class="w-screen left-0 h-32 bg-(--text-disabled) absolute image banner"
								:style="{
									backgroundImage: `url(${previews.banner || `${config.public.bannersCdnBase}/${user?.id}`})`,
								}"
							>
								<label
									class="bg-(--bg-overlay) w-full h-full flex justify-center items-center"
								>
									<input
										type="file"
										name="banner"
										class="hidden"
										accept="image/*"
										@change="onFileChange($event, 'banner')"
									/>
									<span
										class="pi pi-camera text-(--text-on-overlay) text-2xl"
									></span>
								</label>
							</div>
						</div>
						<div
							class="w-24 h-24 bg-red-300 rounded-md -mt-16 z-10 image bg-center"
							:style="{
								backgroundImage: `url(${previews.avatar || `${config.public.avatarsCdnBase}/${user?.id}`})`,
							}"
						>
							<label
								class="bg-(--bg-overlay) w-full h-full rounded-md flex justify-center items-center"
							>
								<input
									type="file"
									name="avatar"
									class="hidden"
									accept="image/*"
									@change="onFileChange($event, 'avatar')"
								/>
								<span class="pi pi-camera text-(--text-on-overlay) text-2xl"></span>
							</label>
						</div>

						<p>Username</p>
						<input type="text" name="username" :value="user?.username" />
						<p>Bio</p>
						<textarea name="bio" class="flex-1"></textarea>
						<div class="flex gap-2 w-full">
							<button class="flex-1" type="submit">save</button>
						</div>
					</form>
				</div>
			</div>
		</Transition>
	</ClientOnly>
</template>
<style lang="scss" scoped>
.banner {
	background-position: 0 50%;
}
.image {
	background-size: cover;
	background-repeat: no-repeat;
}
</style>
