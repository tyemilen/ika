import { BaseBookResponse } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseBookResponse[]> => {
	const { user } = await requireUserSession(event);

	const books = await event.context.db.query.books.findMany({
		where: (books, { eq }) => eq(books.createdBy, user.id),
		with: {
			reviewer: true,
			language: {
				columns: {
					code: true,
				},
			},
			descriptions: {
				columns: {
					description: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
			covers: true,
			titles: {
				columns: {
					title: true,
				},
				with: {
					language: {
						columns: {
							code: true,
						},
					},
				},
			},
			themes: {
				with: {
					theme: {
						columns: {
							name: true,
						},
					},
				},
			},
			genres: {
				with: {
					genre: {
						columns: {
							name: true,
						},
					},
				},
			},
		},
	});

	return books.map((b) => ({
		id: b.id,
		slug: b.slug,
		status: b.status,
		language: b.language.code,
		publicationStatus: b.publicationStatus,
		publicationYear: b.publicationYear,
		descriptions: b.descriptions.map((d) => ({
			language: d.language.code,
			content: d.description,
		})),
		covers: b.covers.map((c) => ({
			id: c.id,
			isPrimary: c.isPrimary,
		})),
		titles: b.titles.map((t) => ({
			language: t.language.code,
			content: t.title,
		})),
		genres: b.genres.map((g) => (g.genre as { name: string }).name),
		themes: b.themes.map((t) => (t.theme as { name: string }).name),
	}));
});
