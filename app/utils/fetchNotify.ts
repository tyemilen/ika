import type {
	NitroFetchRequest,
	NitroFetchOptions,
	AvailableRouterMethod,
	InternalApi,
} from 'nitropack';

export const $fetchNotify = <
	T = any,
	R extends NitroFetchRequest = NitroFetchRequest,
	M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>,
>(
	request: R,
	options?: NitroFetchOptions<R, M> & { progress?: string; success?: string },
): Promise<
	T extends unknown
		? R extends keyof InternalApi
			? M extends keyof InternalApi[R]
				? InternalApi[R][M]
				: any
			: any
		: T
> => {
	const token = useCookie('auth_token').value;
	const { notify, removeNotification } = useNotifications();

	const progressNotification = notify({
		type: 'progress',
		text: options?.progress || 'Loading...',
		time: -1,
	});

	return ($fetch as any)(request, {
		...options,
		headers: {
			...options?.headers,
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			Accept: 'application/json',
		},
		credentials: 'include',
		async onResponse({ response }: any) {
			removeNotification(progressNotification);

			const contentType = response.headers.get('content-type');

			if (response.ok && contentType && contentType.includes('application/json')) {
				notify({
					type: 'success',
					text: options?.progress || 'Done',
				});
			} else {
				notify({
					type: 'error',
					text: `Oops something went wrong sorry - ${response.status}: ${response.statusText}`,
				});
			}
		},
	});
};
