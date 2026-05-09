import z from 'zod';

export const MyHistoryPostBodySchema = z.object({
	bookId: z.uuid(),
	pageId: z.uuid(),
	timeSpent: z.number(),
});

export type MyHistoryPostBody = z.infer<typeof MyHistoryPostBodySchema>;
