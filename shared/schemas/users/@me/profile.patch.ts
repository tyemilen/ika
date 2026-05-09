import { z } from 'zod';
import constants from '~~/shared/constants';

export const MyProfilePatchBodySchema = z.object({
	username: z
		.string()
		.min(2)
		.max(32)
		.regex(
			/^[a-zA-Z0-9_\u0400-\u04FF]+$/,
			'Only Latin, Cyrillic, numbers, and underscores allowed',
		)
		.optional(),
	bio: z.string().min(1).max(52).optional(),
	avatar: z
		.file()
		.mime(constants.ACCEPTED_IMAGE_TYPES)
		.max(constants.MAX_PROFILE_FILE_SIZE)
		.optional(),
	banner: z
		.file()
		.mime(constants.ACCEPTED_IMAGE_TYPES)
		.max(constants.MAX_PROFILE_FILE_SIZE)
		.optional(),
});

export type MyProfilePatchBody = z.infer<typeof MyProfilePatchBodySchema>;
