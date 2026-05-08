export default defineEventHandler(async (event) => {
	const [genres, themes, languages] = await Promise.all([
		event.context.db.query.metaGenres.findMany({
			columns: {
				id: true,
				name: true,
			},
		}),
		event.context.db.query.metaThemes.findMany({
			columns: {
				id: true,
				name: true,
			},
		}),
		event.context.db.query.metaLanguages.findMany({
			columns: {
				id: true,
				code: true,
			},
		}),
	]);

	return {
		genres,
		themes,
		languages,
	};
});
