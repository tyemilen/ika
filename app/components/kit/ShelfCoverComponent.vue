<script setup lang="ts">
import { ref } from 'vue';
import defaultShelf from '~/assets/img/defaultShelf.svg';

const props = defineProps<{
	id: string;
	userId: string;
}>();

const isError = ref(false);

const handleImageError = () => {
	isError.value = true;
};
</script>
<template>
	<img v-if="isError" :src="defaultShelf" alt="Shelf" />
	<NuxtImg v-else provider="shelfCovers" :src="`/${userId}/${id}`" @error="handleImageError" />
</template>
