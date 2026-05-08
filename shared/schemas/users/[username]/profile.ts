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
	ttw: number;
	likes: number;
	shelves: {
		id: string;
		name: string;
		type: string;
	}[];
	compatibility?: {
		books: {
			id: string;
			title: string;
			coverId: string;
			totalTime: number;
			myTime: number;
			targetTime: number;
		}[];
		value: number;
	};
}
