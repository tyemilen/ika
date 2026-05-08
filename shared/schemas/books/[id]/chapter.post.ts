import { z } from 'zod';
// formdata
export const BooksChapterPostBodySchema = z
	.object({
		number: z.float32('Chapter number required'),
		volume: z.float32('Chapter volume number required'),
		name: z.string('Chapter name required').min(1),
		language: z.uuid('Language required'),
		pages: z.array(z.file()).min(1)
	})
export type BooksChapterPostBody = z.infer<typeof BooksChapterPostBodySchema>;
