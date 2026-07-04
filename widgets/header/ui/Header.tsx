

import React, { useState, useRef, useEffect } from 'react';
import { UserRole } from '../../../entities/user';
import { Notification } from '../../../entities/notification';


interface HeaderProps {
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  notifications: Notification[];
  onNavigateToNotifications: () => void;
  onToggleSidebar: () => void;
}

const RoleSwitcher: React.FC<Pick<HeaderProps, 'currentRole' | 'setCurrentRole'>> = ({ currentRole, setCurrentRole }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const handleRoleSelect = (role: UserRole) => {
        setCurrentRole(role);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="bg-emerald-500/10 text-emerald-300 rounded-full py-2 px-4 sm:px-5 w-28 sm:w-32 flex items-center justify-between cursor-pointer hover:bg-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-emerald-500 transition-colors font-semibold text-sm sm:text-base"
            >
                <span>{currentRole}</span>
                <svg
                  className={`h-4 w-4 text-emerald-300/80 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-32 bg-zinc-800 rounded-2xl shadow-lg z-10 overflow-hidden border border-zinc-700">
                    <ul className="text-gray-200">
                        {Object.values(UserRole).map((role) => (
                            <li 
                                key={role} 
                                onClick={() => handleRoleSelect(role)}
                                className={`px-4 py-2 cursor-pointer transition-colors text-sm sm:text-base ${role === currentRole ? 'bg-emerald-500/20 font-semibold text-emerald-300' : 'hover:bg-zinc-700/50'}`}
                            >
                                {role}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

const NotificationBell: React.FC<{ notifications: Notification[]; onClick: () => void }> = ({ notifications, onClick }) => {
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <button onClick={onClick} className="relative text-gray-400 hover:text-white transition-colors" aria-label="Open notifications">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center ring-2 ring-zinc-900">{unreadCount}</span>
            )}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ currentRole, setCurrentRole, notifications, onNavigateToNotifications, onToggleSidebar }) => {
  return (
     <header className="bg-zinc-900/50 backdrop-blur-lg border border-zinc-700/80 py-3 px-4 sm:px-6 flex items-center justify-between flex-shrink-0 rounded-full shadow-lg">
        {/* Left: Hamburger, Logo and App Name */}
        <div className="flex items-center gap-2 sm:gap-3">
            <button onClick={onToggleSidebar} className="lg:hidden text-gray-400 hover:text-white" aria-label="Open sidebar">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
          <div className="flex items-center justify-center h-8 w-8 rounded-lg p-1 text-emerald-500">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-gray-100 text-base sm:text-lg font-bold tracking-wide hidden sm:block">Smart Scheduler</h1>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-lg mx-6 relative hidden lg:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-zinc-800/50 border border-zinc-700 text-gray-200 placeholder-gray-500 rounded-full py-2 pl-10 pr-4 outline-none focus:bg-zinc-800 focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>

        {/* Right: User Role, Notifications, Avatar */}
        <div className="flex items-center gap-3 sm:gap-5">
          <RoleSwitcher currentRole={currentRole} setCurrentRole={setCurrentRole} />
          <NotificationBell notifications={notifications} onClick={onNavigateToNotifications} />
          <div className="rounded-full w-8 h-8 sm:w-9 sm:h-9 overflow-hidden bg-gray-600 flex items-center justify-center ring-2 ring-zinc-700">
            <img src="https://picsum.photos/100" alt="User Avatar" className="w-full h-full object-cover" />
          </div>
        </div>
      </header>
  );
};

export default React.memo(Header);