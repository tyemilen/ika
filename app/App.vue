<script setup lang="ts">
useGateway();
</script>
<template>
	<NuxtLayout>
		<NuxtLoadingIndicator :height="2" color="var(--color-primary)" />
		<NuxtPage />
	</NuxtLayout>
	<PanelComponent />
	<NotificationComponent />
</template>
