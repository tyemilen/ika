import {
	useWebSocket,
	type UseWebSocketOptions,
	type UseWebSocketReturn,
	type WebSocketStatus,
} from '@vueuse/core';
import { computed, type Ref, type ShallowRef } from 'vue';

type WSResult = UseWebSocketReturn<any>;
export const useWS = (path: string | Ref<string>, options: UseWebSocketOptions = {}): WSResult => {
	if (import.meta.client) {
		const fullUrl = computed(() => {
			const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
			const host = window.location.host;
			const relativePath = typeof path === 'string' ? path : path.value;
			return `${protocol}//${host}${relativePath.startsWith('/') ? '' : '/'}${relativePath}`;
		});

		const socket = useWebSocket(fullUrl, options);
		return socket;
	}

	const status: ShallowRef<WebSocketStatus> = shallowRef('CLOSED');

	return {
		status: status,
		data: ref(null),
		send: () => {},
		open: () => {},
		close: () => {},
		binaryType: ref('blob' as const),
		bufferedAmount: ref(0),
		error: ref(undefined),
	} as unknown as WSResult;
};
