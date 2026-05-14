import { z } from 'zod';

export const BooksSearchPostBodySchema = z.object({
	title: z.string().optional(),

	genres: z.array(z.uuid()).optional(),
	themes: z.array(z.uuid()).optional(),

	publicationYear: z.coerce
		.number({
			error: 'Year must be a number',
		})
		.optional(),

	language: z.uuid().optional(),

	chapterLanguage: z.uuid().optional(),

	publicationStatus: z.enum(['ongoing', 'completed', 'paused', 'cancelled']).optional(),
});
export type BooksSearchPostBody = z.infer<typeof BooksSearchPostBodySchema>;
