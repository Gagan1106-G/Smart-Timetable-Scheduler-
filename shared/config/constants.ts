
// FIX: The Resource type is defined in the resource entity, not schedule.
import { ScheduleItem, DayOfWeek } from '../../entities/schedule';
import { Resource } from '../../entities/resource';
import { Notification } from '../../entities/notification';


export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export const DAYS_OF_WEEK: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const MOCK_SCHEDULE: ScheduleItem[] = [];

export const MOCK_RESOURCES: Resource[] = [];

export const MOCK_TEACHERS: string[] = [];
export const MOCK_SUBJECTS = ['Algebra II', 'World History', 'Chemistry', 'Physical Ed.', 'English Lit.', 'Physics', 'Calculus', 'Art History'];


export const MOCK_NOTIFICATIONS: Notification[] = [
    { id: 'n1', message: 'Room change for Algebra II to Room 105.', read: false, timestamp: new Date(), type: 'Info' },
    { id: 'n2', message: 'Chemistry class on Monday is cancelled.', read: false, timestamp: new Date(Date.now() - 3600 * 1000), type: 'Warning' },
    { id: 'n3', message: 'Parent-teacher meetings scheduled for next Friday.', read: true, timestamp: new Date(Date.now() - 86400 * 1000 * 2), type: 'Info' },
];
