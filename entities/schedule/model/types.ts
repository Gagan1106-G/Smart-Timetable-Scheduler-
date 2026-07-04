export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';

export interface ScheduleItem {
  id: string;
  subject: string;
  teacher: string;
  studentGroup: string;
  roomId: string;
  day: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string; // "10:00"
  color: string;
}

export interface Conflict {
  itemId: string;
  message: string;
  suggestions?: string[];
}
