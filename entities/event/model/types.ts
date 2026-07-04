export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  time: string; // HH:MM
  type: 'Exam' | 'Event';
}