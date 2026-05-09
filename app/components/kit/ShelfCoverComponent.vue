<script setup lang="ts">
import { ref } from 'vue';
import defaultShelf from '~/assets/img/defaultShelf.svg';

const props = defineProps<{
	id: string;
	type: string;
	userId: string;
}>();

const isError = ref(false);

const handleImageError = () => {
	isError.value = true;
};
</script>
<template>
	<div>
		<img v-if="type == 'liked'" src="~/assets/img/likedShelf.svg" />
		<template v-else>
			<img v-if="isError" :src="defaultShelf" alt="Shelf" />
			<NuxtImg
				v-else
				provider="shelfCovers"
				:src="`/${userId}/${id}`"
				@error="handleImageError"
			/>
		</template>
	</div>
</template>
