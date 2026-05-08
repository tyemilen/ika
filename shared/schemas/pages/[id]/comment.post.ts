import { z } from 'zod';
import constants from '~~/shared/constants';

export const PageCommentsPostBodySchema = z.object({
	text: z.string().min(1).max(constants.MAX_COMMENT_LENGTH),
});

export type PageCommentsPostBody = z.infer<typeof PageCommentsPostBodySchema>;
