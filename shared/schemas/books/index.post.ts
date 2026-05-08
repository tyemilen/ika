import { z } from 'zod';
import constants from '~~/shared/constants';
import { jsonSchema } from '~~/shared/util';
// formdata
export const BooksPostBodySchema = z
	.object({
		title: z.string().min(1, 'Title is required'),

		titleLang: z.uuid('Please select a valid title language'),

		authorsIds: jsonSchema(z.array(z.uuid('Invalid author ID'))),
		authorsNames: jsonSchema(z.string().array()),

		artistsIds: jsonSchema(z.array(z.uuid('Invalid artist ID'))),
		artistsNames: jsonSchema(z.string().array()),

		genres: jsonSchema(z.array(z.uuid()).min(1, 'At least one genre is required')),
		themes: jsonSchema(z.array(z.uuid())),

		publicationYear: z.coerce.number({
			error: 'Year must be a number',
		}),

		language: z.uuid().min(1, 'Original language is required'),

		titles: jsonSchema(
			z.array(
				z.object({
					language: z.uuid('Invalid language for alternative title'),
					content: z.string().min(1, 'Alternative title cannot be empty'),
				}),
			),
		),

		descriptions: jsonSchema(
			z
				.array(
					z.object({
						language: z.uuid('Invalid language for description'),
						content: z.string().min(1, 'Description cannot be empty'),
					}),
				)
				.optional(),
		),

		publicationStatus: jsonSchema(
			z.enum(['ongoing', 'completed', 'paused', 'cancelled'], {
				message: 'Publication status is required',
			}),
		),

		cover: z
			.file('Cover is required')
			.mime(constants.ACCEPTED_IMAGE_TYPES)
			.max(constants.MAX_BOOK_COVER_SIZE),
	})
	.refine((data) => data.artistsIds.length > 0 || data.artistsNames.length > 0, {
		message: 'At least one artist is required',
		path: ['artistsIds'],
	})
	.refine((data) => data.authorsIds.length > 0 || data.authorsNames.length > 0, {
		message: 'At least one author is required',
		path: ['authorsIds'],
	});

export type BooksPostBody = z.infer<typeof BooksPostBodySchema>;

export interface BooksPostResponse {
	id: string;
}
