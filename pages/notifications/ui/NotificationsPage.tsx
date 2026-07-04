
import React from 'react';
import { Notification } from '../../../entities/notification';

// Helper to format time difference
const timeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    if (seconds < 5) return "just now";
    return Math.floor(seconds) + " seconds ago";
};


interface NotificationsPageProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
}

const getNotificationStyle = (type: Notification['type']): { bg: string; indicator: string; textColor: string; } => {
    switch (type) {
        case 'Urgent':
            return { bg: 'bg-red-500/15', indicator: 'bg-red-400', textColor: 'text-red-100' };
        case 'Warning':
            return { bg: 'bg-yellow-500/15', indicator: 'bg-yellow-400', textColor: 'text-yellow-100' };
        case 'Info':
        default:
            return { bg: 'bg-blue-500/15', indicator: 'bg-blue-500', textColor: 'text-blue-100' };
    }
};

const NotificationItem: React.FC<{ notification: Notification; onMarkAsRead: (id: string) => void }> = ({ notification, onMarkAsRead }) => {
    const baseStyles = getNotificationStyle(notification.type);

    const styles = notification.read 
        ? { bg: 'bg-zinc-800/50', indicator: 'bg-zinc-600', textColor: 'text-gray-400' }
        : baseStyles;

    return (
        <div className={`p-4 rounded-3xl flex items-start space-x-4 ${styles.bg}`}>
            <div className="flex-shrink-0 mt-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${styles.indicator}`}></div>
            </div>
            <div className="flex-grow">
                <p className={`text-sm font-medium ${styles.textColor}`}>{notification.message}</p>
                <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.timestamp)}</p>
            </div>
            {!notification.read && (
                <button 
                    onClick={() => onMarkAsRead(notification.id)} 
                    className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex-shrink-0"
                >
                    Mark as read
                </button>
            )}
        </div>
    );
}


const NotificationsPage: React.FC<NotificationsPageProps> = ({ notifications, onMarkAsRead, onMarkAllAsRead }) => {
    const unreadNotifications = notifications.filter(n => !n.read).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const readNotifications = notifications.filter(n => n.read).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                {unreadNotifications.length > 0 && (
                    <button 
                        onClick={onMarkAllAsRead}
                        className="px-5 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-3xl hover:bg-emerald-700 transition"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="space-y-8">
                <section>
                    <h2 className="text-lg font-semibold text-gray-300 mb-3">Unread</h2>
                    {unreadNotifications.length > 0 ? (
                        <div className="space-y-3">
                            {unreadNotifications.map(n => <NotificationItem key={n.id} notification={n} onMarkAsRead={onMarkAsRead} />)}
                        </div>
                    ) : (
                        <div className="bg-zinc-800/50 p-6 rounded-3xl shadow-md border border-zinc-700/80">
                            <p className="text-center text-gray-400">You're all caught up!</p>
                        </div>
                    )}
                </section>
                
                <section>
                    <h2 className="text-lg font-semibold text-gray-300 mb-3">Read</h2>
                    {readNotifications.length > 0 ? (
                        <div className="space-y-3">
                            {readNotifications.slice(0, 10).map(n => <NotificationItem key={n.id} notification={n} onMarkAsRead={onMarkAsRead} />)}
                        </div>
                    ) : (
                         <div className="bg-zinc-800/50 p-6 rounded-3xl shadow-md border border-zinc-700/80">
                            <p className="text-center text-gray-400">No previously read notifications.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default NotificationsPage;