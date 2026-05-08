<script setup lang="ts">
const props = defineProps<{
	bookId: string;
	id: string;
}>();
</script>

<template>
	<NuxtImg provider="covers" :src="`${bookId}/${id}`" />
</template>
