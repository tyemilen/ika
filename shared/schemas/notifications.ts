import type { InferEnum } from 'drizzle-orm';
import type { NotificationType } from '..';
import type { bookStatusEnum } from '~~/db';

export interface BaseNotificationResponse {
	type: NotificationType;
	display: {
		title: string;
		description: string;
		thumbnail: string;
	};
	createdAt: number;
}

export interface NotifMyBookStatusUpdateData {
	title: string;
	status: InferEnum<typeof bookStatusEnum>;
	cover_id: string;
	book_id: string;
}

export interface NotifNewChapterData {
	name: string;
	number: number;
	volume: number;
	book_id: string;
	cover_id: string;
	book_title: string;
	chapter_id: string;
}
