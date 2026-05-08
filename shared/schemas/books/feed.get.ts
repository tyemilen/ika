import type { BaseBookResponse, BaseChapterResponse } from '../base';

export interface BooksFeedResponse {
	fresh: BaseBookResponse[];
	chapters: BaseChapterResponse[];
}
