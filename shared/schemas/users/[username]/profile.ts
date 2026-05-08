export interface UsersProfileResponse {
	id: string;
	display_name: string;
	username: string;
	bio: string | null;
	status: {
		bookName: string | null;
		status: USER_STATUS;
		lastSeen: number;
	};
}
