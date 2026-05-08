import { z } from 'zod';

import constants from '~~/shared/constants';
// formdata
export const LibraryShelfPostBodySchema = z.object({
	name: z.string('Name is required').min(1).max(64),
	cover: z
		.file()
		.mime(constants.ACCEPTED_IMAGE_TYPES)
		.max(constants.MAX_BOOK_COVER_SIZE)
		.optional(),
});
export type LibraryShelfPostBody = z.infer<typeof LibraryShelfPostBodySchema>;
