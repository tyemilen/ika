import z from 'zod';

export const jsonSchema = <T extends z.ZodTypeAny>(schema: T) =>
	z.preprocess((val) => {
		if (typeof val !== 'string') return val;
		try {
			return JSON.parse(val);
		} catch {
			return val;
		}
	}, schema);