import type { AdapterInternal, Peer } from 'crossws';

import { WS_CODES } from '~~/shared/constants';

import { WsUserStatus, WsUserStatusMsgSchema } from '~~/shared/schemas';

interface WsMessage<T> {
	code: number;
	data: T;
}

interface PeerContext {
	user: { id: string };
	timeoutId?: NodeJS.Timeout;
}
const usersWs = new Map<string, Peer<AdapterInternal>>();

export const notifyUser = (userId: string, data: any) => {
	const peer = usersWs.get(userId);

	if (!peer) return;

	peer.send({
		code: WS_CODES.NOTIFICATION,
		data,
	});
};

export default defineWebSocketHandler({
	async upgrade(request) {
		await requireUserSession(request);
	},

	async open(peer) {
		const { user } = await requireUserSession(peer);
		console.log('[WS] New connection:', user.id);

		const timeout = setTimeout(() => {
			peer.close(WS_CODES.TIMEOUT, 'TIMEOUT');
		}, 60 * 1000);

		peer.context.timeoutId = timeout;
		peer.context.user = user;

		usersWs.set(user.id, peer);
		peer.send('ok');
	},

	async close(peer) {
		if (!peer.context.user) return;
		if (peer.context.timeoutId) {
			clearTimeout((peer as any).timeoutId);
		}
		usersWs.delete((peer.context as unknown as PeerContext).user.id);
	},

	async message(peer, message) {
		const { user } = await requireUserSession(peer);
		const app = useNitroApp();

		try {
			const msg: WsMessage<any> = message.json();

			switch (msg.code) {
				case WS_CODES.STATUS: {
					const result = WsUserStatusMsgSchema.safeParse(msg.data);

					if (!result.success) {
						return;
					}

					if (app.valkey) {
						const data: WsUserStatus = {
							bookName: result.data.bookName || null,
							status: result.data.status,
							lastSeen: Date.now(),
						};

						app.valkey.set(`status:${user.id}`, JSON.stringify(data));
					}
				}
			}
		} catch (err) {
			console.log(err);
		}

		peer.send('pong');
	},
});
