import { z } from 'zod';

export const AuthRegisterBodySchema = z.object({
	username: z
		.string()
		.min(2)
		.max(32)
		.regex(
			/^[a-zA-Z0-9_\u0400-\u04FF]+$/,
			'Only Latin, Cyrillic, numbers, and underscores allowed',
		),
	email: z.email(),
	password: z.string().min(8).max(128),
});

export type AuthRegisterBody = z.infer<typeof AuthRegisterBodySchema>;
