<script setup lang="ts">
import { useNotifications } from '@/composables/useNotification';

const { notifications, removeNotification } = useNotifications();

const icons: Record<AppNotificationType, string> = {
	info: 'majesticons:info-circle',
	error: 'majesticons:close',
	warning: 'majesticons:alert-circle',
	success: 'majesticons:shooting-star',
	progress: 'progress',
};
</script>
<template>
	<div class="notifications">
		<TransitionGroup name="notifications" tag="div" class="notifications-container">
			<template v-for="notification of notifications" :key="notification.id">
				<div
					class="notification text-sm md:text-base"
					:class="[`notification-${notification.type}`]"
					@click.stop="removeNotification(notification)"
				>
					<template v-if="notification.type == 'progress'">
						<div class="spinner"></div>
					</template>
					<Icon v-else :name="icons[notification.type]" class="text-xl md:text-2xl" />
					<p>{{ notification.text }}</p>
				</div>
			</template>
		</TransitionGroup>
	</div>
</template>
<style lang="scss" scoped>
@use 'sass:color';
@use '$/mixins' as *;

.notifications {
	position: fixed;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	overflow: visible;
	z-index: 999;

	padding-bottom: 1em;
	padding-right: 1em;

	@include mobile {
		padding-bottom: 0.5em;
		padding-left: 0.5em;
		padding-right: 0.5em;
	}
}

.notifications-container {
	z-index: 140;
	height: 100%;
	width: 100%;
	overflow: hidden;
	display: flex;
	justify-content: end;
	align-items: end;
	flex-direction: column;
	gap: 1rem;
	position: relative;

	@include mobile {
		align-items: center;
	}
}

.notification {
	display: flex;
	gap: 10px;
	min-width: 15em;
	pointer-events: auto;
	align-items: center;
	width: fit-content;
	height: fit-content;
	padding: 1em;
	border: 2px solid red;
	border-radius: 4px;
	$mix-color: var(--notification-mix-color);

	@include mobile {
		min-width: 50%;
		padding: 0.5em;
	}

	&-info,
	&-progress {
		$color: var(--color-info);

		background-color: color-mix(in srgb, $color, $mix-color 90%);
		color: $color;
		border-color: $color;

		.spinner {
			border-color: $color;
			border-bottom-color: transparent;
		}
	}

	&-error {
		$color: var(--color-error);

		background-color: color-mix(in srgb, $color, $mix-color 90%);
		color: $color;
		border-color: $color;
	}

	&-success {
		$color: var(--color-success);

		background-color: color-mix(in srgb, $color, $mix-color 90%);
		color: $color;
		border-color: $color;
	}

	&-warning {
		$color: var(--color-warning);

		background-color: color-mix(in srgb, $color, $mix-color 90%);
		color: $color;
		border-color: $color;
	}
}

.notifications-move,
.notifications-enter-active,
.notifications-leave-active {
	transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.notifications-enter-from,
.notifications-leave-to {
	opacity: 0;
	transform: scaleY(0.01) translate(30px, 0);
}

.notifications-leave-active {
	position: absolute;
}
</style>
