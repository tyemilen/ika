import type { InferEnum } from 'drizzle-orm';
import type { bookPublicationStatusEnum, bookStatusEnum, shelfType } from '~~/db';
import type { NotificationType } from '..';

export interface BaseSuccessResponse {
	success: boolean;
}

export interface BaseChapterPageResponse {
	id: string;
	chapterId?: string;
}

export interface BaseUserResponse {
	id: string;
	username: string;
}

export interface BaseChapterResponse {
	id: string;
	name: string;
	language: string;
	number: number;
	volume: number;
	author: BaseUserResponse;
	bookId?: string;
	coverId?: string;
	createdAt?: number;
}

export interface BaseBookResponse {
	id: string;
	slug: string;
	status: InferEnum<typeof bookStatusEnum>;
	publicationStatus: InferEnum<typeof bookPublicationStatusEnum>;
	language: string;
	publicationYear: number;

	rating?: number;
	likes?: number;

	descriptions?: {
		content: string;
		language: string;
	}[];
	covers: {
		id: string;
		isPrimary: boolean;
	}[];
	titles: {
		content: string;
		language: string;
	}[];

	genres: string[];
	themes: string[];

	authors?: string[];
	artists?: string[];

	createdAt?: Date;
	updatedAt?: Date;

	chapters?: BaseChapterResponse[];
}

export interface BaseShelfResponse {
	id: string;
	userId: string;
	name: string;
	type: InferEnum<typeof shelfType>;
}

export interface BasePageCommentResponse {
	userId: string;
	displayName: string;
	username: string;
	text: string;
	createdAt: number;
}
