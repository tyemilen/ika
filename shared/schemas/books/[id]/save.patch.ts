import { z } from 'zod';

export const BooksSavePatchBodySchema = z.object({
	shelfId: z.uuid(),
});
export type BooksSavePatchBody = z.infer<typeof BooksSavePatchBodySchema>;
