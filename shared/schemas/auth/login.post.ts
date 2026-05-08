import { z } from 'zod';

export const AuthLoginBodySchema = z.object({
	email: z.email(),
	password: z.string().min(8).max(128),
});

export type AuthLoginBody = z.infer<typeof AuthLoginBodySchema>;
