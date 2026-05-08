export const BOOKS_INDEX = 'books';

export interface BookDocument {
	primaryKey: string;
	slug: string;
	coverId: string;
	title: string;
	genres: string[];
	themes: string[];
}

export const AUTHORS_INDEX = 'books';

export interface AuthorsDocument {
	primaryKey: string;
	slug: string;
	coverId: string;
	title: string;
	genres: string[];
	themes: string[];
}
