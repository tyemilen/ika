import { BaseBookResponse } from '~~/shared/schemas';

export const mapBook = (b: any): BaseBookResponse => {
	return {
		id: b.id,
		slug: b.slug,
		status: b.status,
		language: b.language?.code,
		publicationStatus: b.publicationStatus,
		publicationYear: b.publicationYear,
		covers: b.covers?.map((c: any) => ({
			id: c.id,
			isPrimary: c.isPrimary,
		})),
		titles: b.titles?.map((t: any) => ({
			language: t.language?.code,
			content: t.title,
		})),
		descriptions: b.descriptions?.map((t: any) => ({
			language: t.language?.code,
			content: t.description,
		})),
		genres: b.genres?.map((g: any) => g.genre.name),
		themes: b.themes?.map((t: any) => t.theme.name),
		updatedAt: b.updatedAt,
	};
};
