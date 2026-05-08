import { ref } from 'vue';

const menus = ref<Record<string, boolean>>({});

export const useMenu = () => {
	return {
		isOpen: (name: string): boolean => menus.value[name] || false,
		register: (name: string) => (menus.value[name] = false),
		open: (name: string) => (menus.value[name] = true),
		close: (name: string) => (menus.value[name] = false),
		toggle: (name: string) => (menus.value[name] = !menus.value[name]),
	};
};
