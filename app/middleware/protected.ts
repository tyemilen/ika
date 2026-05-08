export default defineNuxtRouteMiddleware((to) => {
	const { user } = useUser();

	if (!user.value) {
		return navigateTo('/');
	}
	const allowedRoles = (to.meta.allowed as string[]) || [];

	if (allowedRoles.length > 0 && !allowedRoles.includes(user.value.role)) {
		return navigateTo('/');
	}
});
