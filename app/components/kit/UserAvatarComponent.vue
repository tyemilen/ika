<script setup lang="ts">
import { ref } from 'vue';
import defaultAvatar from '~/assets/img/defaultAvatar.svg';

const props = defineProps<{
	id: string;
}>();

const isError = ref(false);

const handleImageError = () => {
	isError.value = true;
};
</script>

<template>
	<img v-if="isError" :src="defaultAvatar" alt="Avatar" />
	<NuxtImg v-else provider="avatars" :src="id" @error="handleImageError" />
</template>
