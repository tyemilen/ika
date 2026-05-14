import { ref, onMounted, onUnmounted } from 'vue';
import { createGlobalState, until, useIntervalFn } from '@vueuse/core';
import { BroadcastChannel, createLeaderElection } from 'broadcast-channel';

import { WS_CODES } from '~~/shared/constants';

const GATEWAY_CHANNEL = 'gateway-channel';
const HEARTBEAT_INTERVAL = 3000;

const created = ref(false);
const ws = ref<ReturnType<typeof useWS>>();

const methods = reactive<{
	send: (data: any) => void;
}>({
	send: (_) => {},
});

const userStatus = ref<{ status: USER_STATUS; bookName: string | null }>({
	status: 'online',
	bookName: null,
});

export const useGateway = createGlobalState(() => {
	if (!import.meta.client) return {};

	const startReading = (bookName: string) => {
		userStatus.value.bookName = bookName;
	};

	const stopReading = () => (userStatus.value.bookName = null);

	if (created.value)
		return {
			ws,
			send: methods.send,
			startReading,
			stopReading,
			status: ws.value ? unref(ws.value.status) : 'CLOSED',
		};

	created.value = true;
	const elector = createLeaderElection(new BroadcastChannel(GATEWAY_CHANNEL), {
		fallbackInterval: 1000,
	});

	const { loggedIn, clear: clearSession, fetch: refreshSession } = useUserSession();

	const send = (data: any) => {
		if (!loggedIn.value) return;
		if (!elector.isLeader || !ws.value) return;
		// vue unwraps ws.value.status (bc createGlobalState is just reactive underneath and reactive unwraps all refs), but typescript is angry so
		// https://vuejs.org/api/reactivity-advanced.html#effectscope
		if (!ws.value || unref(ws.value.status) != 'OPEN') return;
		ws.value.send(JSON.stringify(data));
	};

	methods.send = send;

	const sendStatus = () => {
		send({
			code: WS_CODES.STATUS,
			data: {
				status: userStatus.value.status,
				bookName: userStatus.value.bookName,
			},
		});
	};
	const statusInterval = useIntervalFn(sendStatus, HEARTBEAT_INTERVAL, {
		immediate: false,
	});

	onMounted(async () => {
		// await elector.awaitLeadership();
		await until(loggedIn).toBe(true);

		const state = useGlobalState();

		ws.value = useWS('/ws', {
			autoConnect: true,
			autoReconnect: {
				retries: 5,
				delay: (retries) => retries * 1000,
			},
			async onDisconnected(_, event) {
				switch (event.code) {
					case WS_CODES.TIMEOUT:
						break;
					default:
						ws.value?.close();
						break;
				}
			},
			async onMessage(ws, event) {
				if (!event.data.startsWith('{')) return;

				const data = JSON.parse(event.data);

				state.addNotification(data);
			},
		});
		statusInterval.resume();
	});

	onUnmounted(() => {
		statusInterval.pause();
		ws.value?.close();
	});

	return {
		ws,
		send: methods.send,
		startReading,
		stopReading,
		status: ws.value ? unref(ws.value.status) : 'CLOSED',
	};
});
