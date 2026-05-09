import type { BaseBookResponse, BaseChapterResponse } from '../base';

export interface BooksFeedResponse {
	fresh: BaseBookResponse[];
	chapters: BaseChapterResponse[];
	trending: {
		id: string;
		slug: string;
		covers: {
			id: string;
			isPrimary: boolean;
		}[];
		titles: {
			content: string;
			language: string;
		}[];
		descriptions: {
			content: string;
			language: string;
		}[];
		score: number;
	}[];
}
