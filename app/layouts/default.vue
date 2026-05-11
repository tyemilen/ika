<script setup lang="ts">
import BottomPanelComponent from '~/components/BottomPanelComponent.vue';

const mainRef = useTemplateRef('main');
</script>

<template>
	<div class="flex flex-col h-dvh">
		<HeaderComponent :main-ref="mainRef" />
		<div class="flex-1 relative min-h-0 overflow-y-auto overflow-x-hidden" ref="main">
			<div
				class="flex flex-col gap-4 w-[95%] md:w-[70%] h-full relative centered pt-[calc(var(--header-height)+1.25rem)]"
			>
				<slot />
			</div>
		</div>
		<BottomPanelComponent />
	</div>
</template>
