<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
	id: string;
}>();

const isError = ref(false);

const handleImageError = () => {
	isError.value = true;
};
</script>

<template>
	<div v-if="isError" class="w-full h-36 bg-(--outline-v)"></div>
	<NuxtImg v-else provider="banners" :src="id" @error="handleImageError" />
</template>
