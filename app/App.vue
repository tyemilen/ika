<script setup lang="ts">
useGateway();
</script>
<template>
	<NuxtLayout>
		<NuxtLoadingIndicator :height="2" color="var(--primary)" />
		<NuxtPage />
	</NuxtLayout>
	<PanelComponent />
	<NotificationComponent />
</template>
