<script setup lang="ts">
import type { NuxtError } from '#app';

const props = defineProps<{ error: NuxtError }>();
</script>

<template>
	<div class="w-full h-full flex flex-col justify-between">
		<div class="flex flex-col items-center gap-5">
			<h1>{{ error.status }}</h1>
			<NuxtLink to="/">
				<button>go home</button>
			</NuxtLink>
		</div>
		<TentaclesIcon />
	</div>
</template>
