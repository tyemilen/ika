export default defineEventHandler(async (event) => {
	const authHeader = getHeader(event, 'authorization');

	if (authHeader?.startsWith('Bearer ')) {
		const token = authHeader.split(' ')[1];

		if (!event.context.sessions) event.context.sessions = {};

		event.context.sessions['nuxt-session'] = {
			id: 'b6f33166-ce92-4013-9c2b-0e7973467b53',
			createdAt: Date.now(),
			data: {
				user: {
					id: '019de0cd-4ffc-7d06-a8db-8f3ab0bec36f',
					role: 'admin',
					sessionId: null,
				},
			},
		};

		console.log(event.context.sessions);
	}
});
