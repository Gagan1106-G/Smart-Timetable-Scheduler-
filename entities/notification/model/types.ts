export interface Notification {
  id: string;
  message: string;
  read: boolean;
  timestamp: Date;
  type: 'Info' | 'Warning' | 'Urgent';
}
