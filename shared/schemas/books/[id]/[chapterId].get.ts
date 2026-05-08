interface ChapterInfo {
	id: string;
	volume: string;
	number: string;
	name: string;
}
export interface BooksChapterResponse {
	book: {
		name: string;
		slug: string;
	};
	chapter: ChapterInfo;
	prev?: ChapterInfo;
	next?: ChapterInfo;
	pages: string[];
}
