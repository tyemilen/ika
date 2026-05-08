declare module '#auth-utils' {
	interface User {
		id: string;
		role: string;
		sessionId: string;
	}

	interface UserSession {
		user: User;
	}
}

export {};
