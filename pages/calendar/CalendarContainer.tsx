import { useEffect, useState } from 'react';
import CalendarPage from './ui/CalendarPage';
import { CalendarEvent } from '../../entities/event';
import { UserRole } from '../../entities/user';

/**
 * ✅ CalendarContainer - Parent component that manages events state
 * Location: pages/calendar/CalendarContainer.tsx
 */
export default function CalendarContainer() {
  // Load events once from localStorage
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const raw = localStorage.getItem('calendarEvents');
      return raw ? (JSON.parse(raw) as CalendarEvent[]) : [];
    } catch {
      return [];
    }
  });

  // Persist events whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('calendarEvents', JSON.stringify(events));
    } catch (err) {
      console.error('Failed to save events to localStorage', err);
    }
  }, [events]);

  // Set the user role here
  // Change this line when testing different portals
  const currentRole: UserRole = UserRole.Admin;
  // e.g. UserRole.Teacher or UserRole.Student

  // ADD EVENT
  const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...event,
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  // DELETE ONE EVENT
  const handleRemoveEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  // DELETE ALL EVENTS
  const handleClearAllEvents = () => {
    setEvents([]);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <CalendarPage
        events={events}
        onAddEvent={handleAddEvent}
        onRemoveEvent={handleRemoveEvent}
        onClearAllEvents={handleClearAllEvents}
        currentRole={currentRole}
      />
    </div>
  );
}
