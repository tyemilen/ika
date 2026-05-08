import z from 'zod';

export interface WsUserStatus {
	bookName: string | null;
	status: USER_STATUS;
	lastSeen: number;
}

export interface WsUserStatusMessage {
	bookName: string | null;
	status: USER_STATUS;
}

export const WsUserStatusMsgSchema = z.object({
	bookName: z.string().min(1).max(256).nullable().optional(),
	status: z.enum(['offline', 'online', 'do_not_distrub', 'away']),
});
