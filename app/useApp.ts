
import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../entities/user';
import { MOCK_NOTIFICATIONS, MOCK_SCHEDULE, MOCK_RESOURCES } from '../shared/config';
import { Notification } from '../entities/notification';
import { Department } from '../entities/staff';
import { Resource } from '../entities/resource';
import { CalendarEvent } from '../entities/event';
import { useTimetable } from '../features/schedule-management';

export type View = 'home' | 'dashboard' | 'calendar' | 'notifications' | 'camera';

// Helper to load state from localStorage, with a default value
const loadFromLocalStorage = <T>(key: string, defaultValue: T): T => {
    try {
        const storedValue = localStorage.getItem(key);
        if (storedValue) {
            return JSON.parse(storedValue) as T;
        }
    } catch (error) {
        console.error(`Error loading ${key} from localStorage, using default.`, error);
    }
    return defaultValue;
};

// Specific loader for notifications to handle Date objects
const loadNotificationsFromLocalStorage = (): Notification[] => {
    try {
        const storedValue = localStorage.getItem('smartScheduler_notifications');
        if (storedValue) {
            const parsed = JSON.parse(storedValue) as any[];
            return parsed.map(n => ({ ...n, timestamp: new Date(n.timestamp) }));
        }
    } catch (error) {
        console.error(`Error loading notifications from localStorage, using default.`, error);
    }
    return MOCK_NOTIFICATIONS;
};


export const useApp = () => {
    const [currentRole, setCurrentRole] = useState<UserRole>(() => 
        loadFromLocalStorage('smartScheduler_currentRole', UserRole.Student)
    );
    const [notifications, setNotifications] = useState<Notification[]>(loadNotificationsFromLocalStorage);
    const [currentView, setCurrentView] = useState<View>('home');
    const [currentTeacher, setCurrentTeacher] = useState<string | null>(null);
    
    const [departments, setDepartments] = useState<Department[]>(() =>
        loadFromLocalStorage('smartScheduler_departments', [])
    );
    const [events, setEvents] = useState<CalendarEvent[]>(() =>
        loadFromLocalStorage('smartScheduler_events', [])
    );
    const [resources, setResources] = useState<Resource[]>(() =>
        loadFromLocalStorage('smartScheduler_resources', MOCK_RESOURCES)
    );
    
    const initialSchedule = loadFromLocalStorage('smartScheduler_schedule', MOCK_SCHEDULE);
    const { schedule, conflicts, updateSchedule } = useTimetable(initialSchedule, resources);

    // --- PERSISTENCE ---
    useEffect(() => {
        localStorage.setItem('smartScheduler_currentRole', JSON.stringify(currentRole));
    }, [currentRole]);

    useEffect(() => {
        localStorage.setItem('smartScheduler_departments', JSON.stringify(departments));
    }, [departments]);
    
    useEffect(() => {
        localStorage.setItem('smartScheduler_events', JSON.stringify(events));
    }, [events]);

    useEffect(() => {
        localStorage.setItem('smartScheduler_resources', JSON.stringify(resources));
    }, [resources]);

    useEffect(() => {
        localStorage.setItem('smartScheduler_schedule', JSON.stringify(schedule));
    }, [schedule]);

    useEffect(() => {
        // Store timestamps as ISO strings for reliable parsing
        localStorage.setItem('smartScheduler_notifications', JSON.stringify(notifications.map(n => ({...n, timestamp: n.timestamp.toISOString()}))));
    }, [notifications]);


    const handleAddEvent = useCallback((newEvent: Omit<CalendarEvent, 'id'>) => {
        setEvents(prev => [...prev, { ...newEvent, id: new Date().toISOString() }]);
    }, []);
    
    const handleCreateNotification = useCallback((message: string, type: Notification['type']) => {
        const newNotification: Notification = {
            id: crypto.randomUUID(),
            message,
            type,
            read: false,
            timestamp: new Date(),
        };
        setNotifications(prev => [newNotification, ...prev]);
    }, []);

    const handleNavigateToCalendar = useCallback(() => {
        setCurrentView('calendar');
    }, []);
    
    const handleNavigateToDashboard = useCallback(() => {
        setCurrentView('dashboard');
    }, []);
    
    const handleNavigateToNotifications = useCallback(() => {
        setCurrentView('notifications');
    }, []);

    const handleNavigateToCamera = useCallback(() => {
        setCurrentView('camera');
    }, []);

    const handleMarkNotificationAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const handleMarkAllAsRead = useCallback(() => {
        setNotifications(prev => prev.map(n => n.read ? n : { ...n, read: true }));
    }, []);

    const handleSetCurrentRole = useCallback((role: UserRole) => {
        if (role !== UserRole.Teacher) {
            setCurrentTeacher(null);
        }
        if (currentView === 'calendar' || currentView === 'notifications' || currentView === 'camera') {
            setCurrentView('dashboard');
        }
        setCurrentRole(role);
    }, [currentView]);

    const handleRoleSelect = useCallback((role: UserRole) => {
        setCurrentRole(role);
        setCurrentView('dashboard');
        if (role !== UserRole.Teacher) {
            setCurrentTeacher(null);
        }
    }, []);

    return {
        currentRole,
        notifications,
        currentView,
        currentTeacher,
        departments,
        events,
        schedule,
        conflicts,
        resources,
        setResources,
        setCurrentTeacher,
        setDepartments,
        updateSchedule,
        handleAddEvent,
        handleNavigateToCalendar,
        handleNavigateToDashboard,
        handleNavigateToNotifications,
        handleNavigateToCamera,
        handleSetCurrentRole,
        handleRoleSelect,
        handleMarkNotificationAsRead,
        handleMarkAllAsRead,
        handleCreateNotification,
    };
};
