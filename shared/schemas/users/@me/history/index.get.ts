export type UsersMeHistoryEntryResponse = {
	book: {
		id: string;
		coverId: string;
		title: string;
	};
	chapter: {
		id: string;
		name: string;
	};
	timeSpent: number;
	pageNumber: number;
	progress: number;
	updatedAt: number;
};

export type UsersMeHistoryResponse = UsersMeHistoryEntryResponse[];
