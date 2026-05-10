<script setup lang="ts">
import { onClickOutside, useScrollLock } from '@vueuse/core';
import { useTemplateRef, watchEffect } from 'vue';

import {
	AuthLoginBodySchema,
	AuthRegisterBodySchema,
	type AuthLoginBody,
	type AuthRegisterBody,
} from '~~/shared/schemas';

const { show } = defineProps<{
	show: boolean;
}>();
const emit = defineEmits<{
	close: [];
}>();

const isLogin = ref(true);

const { notify } = useNotifications();

const loginData = reactive<AuthLoginBody>({
	email: '',
	password: '',
});

const route = useRoute();

const submitLogin = async () => {
	const result = AuthLoginBodySchema.safeParse(loginData);

	if (result.error) {
		const { message } = result.error.issues[0]!;
		return notify({ type: 'error', text: `${message}` });
	}

	const response = await $fetchNotify('/api/auth/login', {
		method: 'POST',
		body: loginData,
	}).catch(() => null);

	if (!response) return;

	emit('close');

	await reloadNuxtApp({
		path: route.fullPath,
	});
};

const registerData = reactive<AuthRegisterBody>({
	username: '',
	email: '',
	password: '',
});

const submitRegister = async () => {
	const result = AuthRegisterBodySchema.safeParse(registerData);

	if (result.error) {
		const { message } = result.error.issues[0]!;
		return notify({ type: 'error', text: `${message}` });
	}

	const response = await $fetchNotify('/api/auth/register', {
		method: 'POST',
		body: registerData,
	}).catch(() => null);

	if (!response) return;

	isLogin.value = true;
};

onMounted(() => {
	const isLocked = useScrollLock(document.body);

	watchEffect(() => (isLocked.value = show));

	const dialog = useTemplateRef<HTMLFormElement>('dialog');
	onClickOutside(dialog, () => emit('close'), {
		ignore: ['.notification'],
	});
});
</script>
<template>
	<Transition name="modal">
		<div v-show="show" class="modal-container">
			<form
				class="modal w-[95%] md:w-1/4"
				ref="dialog"
				@submit.prevent="isLogin ? submitLogin() : submitRegister()"
			>
				<template v-if="isLogin">
					<div class="flex flex-col gap-2">
						<input type="email" placeholder="Email" v-model="loginData.email" />
						<input
							type="password"
							placeholder="Password"
							v-model="loginData.password"
						/>
					</div>
					<div class="w-full flex flex-col gap-2">
						<p
							@click="isLogin = false"
							class="cursor-pointer underline underline-offset-2"
						>
							Register?
						</p>
						<button class="w-full" type="submit">Login</button>
					</div>
				</template>
				<template v-else>
					<div class="flex flex-col gap-2">
						<input type="text" placeholder="Username" v-model="registerData.username" />
						<input type="text" placeholder="Email" v-model="registerData.email" />
						<input
							type="password"
							placeholder="Password"
							v-model="registerData.password"
						/>
					</div>
					<div class="w-full flex flex-col gap-2">
						<p
							@click="isLogin = true"
							class="cursor-pointer underline underline-offset-2"
						>
							Login?
						</p>
						<button class="w-full" type="submit">Register</button>
					</div>
				</template>
			</form>
		</div>
	</Transition>
</template>
