import { ref } from 'vue';

const isOpen = ref(false);

export const usePanel = () => {
	return {
		isOpen,
		close: () => (isOpen.value = false),
		open: () => (isOpen.value = true),
	};
};
