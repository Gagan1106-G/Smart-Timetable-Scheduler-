
import { useState, useEffect, useMemo } from 'react';
import { CalendarEvent } from '../../../entities/event';

type CalendarDay = {
    day: number;
    isToday: boolean;
    dateStr: string;
    events: CalendarEvent[];
};

type CalendarGridCell = {
    key: string;
    isPadding: boolean;
    day?: CalendarDay;
};

export const useCalendar = (events: CalendarEvent[], onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [time, setTime] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // New Event Form State
    const [eventTitle, setEventTitle] = useState('');
    const [eventTime, setEventTime] = useState('09:00');
    const [eventType, setEventType] = useState<'Exam' | 'Event'>('Event');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day: number) => {
        const clickedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        if (clickedDate.getMonth() !== currentDate.getMonth()) return;
        setSelectedDate(clickedDate);
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setEventTitle('');
        setEventTime('09:00');
        setEventType('Event');
    }

    const handleAddEvent = () => {
        if (selectedDate && eventTitle) {
            const formattedDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
            onAddEvent({
                date: formattedDate,
                title: eventTitle,
                time: eventTime,
                type: eventType,
            });
            resetForm();
        }
    };
    
    const closeModal = () => {
        resetForm();
    };

    const calendarGrid = useMemo<CalendarGridCell[]>(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const grid: CalendarGridCell[] = [];
        
        const startPadding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
        for (let i = 0; i < startPadding; i++) {
            grid.push({ key: `pad-start-${i}`, isPadding: true });
        }
        
        for (let day = 1; day <= daysInMonth; day++) {
            const today = new Date();
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr).sort((a,b) => a.time.localeCompare(b.time));

            grid.push({
                key: `day-${day}`,
                isPadding: false,
                day: { day, isToday, dateStr, events: dayEvents }
            });
        }
        return grid;
    }, [currentDate, events]);

    return {
        currentDate,
        time,
        isModalOpen,
        selectedDate,
        eventTitle, setEventTitle,
        eventTime, setEventTime,
        eventType, setEventType,
        handlePrevMonth,
        handleNextMonth,
        handleDayClick,
        handleAddEvent,
        closeModal,
        calendarGrid,
    };
};
