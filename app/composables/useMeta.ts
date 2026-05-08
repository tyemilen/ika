import type { MetaResponse } from '~~/shared/schemas';

const meta = reactive<MetaResponse>({
	genres: [],
	themes: [],
	languages: [],
});
export const useMeta = () => {
	const fetchMeta = async () => {
		const data = await $fetch<MetaResponse>('/api/meta');

		meta.genres = data?.genres || [];
		meta.themes = data?.themes || [];
		meta.languages = data?.languages || [];
	};

	return Object.assign(meta, {
		fetchMeta,
	});
};
