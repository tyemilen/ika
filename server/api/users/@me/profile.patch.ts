import { eq } from 'drizzle-orm';
import { profiles, users } from '~~/db';
import { BaseSuccessResponse, MyProfilePatchBodySchema } from '~~/shared/schemas';

export default defineEventHandler(async (event): Promise<BaseSuccessResponse> => {
	const { user } = await requireUserSession(event);

	const formData = await readFormData(event);

	const body = Object.fromEntries(formData.entries());

	const result = MyProfilePatchBodySchema.safeParse(body);

	if (!result.success)
		throw createError({
			statusCode: 400,
			statusMessage: 'Validation Failed',
		});

	const data = result.data;

	if (data.bio) {
		await event.context.db
			.update(profiles)
			.set({
				bio: data.bio,
			})
			.where(eq(profiles.userId, user.id));
	}
	if (data.avatar) {
		await event.context.s3.putAnyObject(
			`user-avatars/${user.id}`,
			data.avatar.stream(),
			data.avatar.type,
		);
	}

	if (data.banner) {
		await event.context.s3.putAnyObject(
			`user-banners/${user.id}`,
			data.banner.stream(),
			data.banner.type,
		);
	}

	return { success: true };
});
