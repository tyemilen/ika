type AppTheme = 'white' | 'dark';
type AppNotificationType = 'info' | 'error' | 'warning' | 'success' | 'progress';

interface AppNotification {
	id: string;
	type: AppNotificationType;
	text: string;
	time: number; // milliseconds
}
