import type { BaseBookResponse, BaseShelfResponse, BaseUserResponse } from '../base';

export interface LibraryShelfResponse {
	name: string;
	type: BaseShelfResponse['type'];
	owner: BaseUserResponse;
	books: {
		id: string;
		slug: string;
		title: string;
		cover: string;
	}[];
}
