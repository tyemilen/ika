export default defineNuxtPlugin(async () => {
	const { fetchUser } = useUser();
	const { fetchMeta } = useMeta();

	await fetchUser();
	await fetchMeta();
});
