

import React, { useState, useMemo, useEffect } from 'react';
import TimetableView from '../../../widgets/timetable';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../../../shared/config';
import DashboardCard from '../../../shared/ui/card';
import { ScheduleItem, Conflict, DayOfWeek } from '../../../entities/schedule';
import { Resource } from '../../../entities/resource';
import { Department } from '../../../entities/staff';
import { useAdminConsole } from '../model/useAdminConsole';
import { Notification } from '../../../entities/notification';


const GeneratorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 16v-2m8-8h2M4 12H2m15.364 6.364l1.414 1.414M4.222 4.222l1.414 1.414M18.364 4.222l-1.414 1.414M5.636 18.364l-1.414 1.414M12 16a4 4 0 110-8 4 4 0 010 8z" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const ManageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197M15 21a6 6 0 00-9-5.197" /></svg>;
const AiIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const NotificationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;


interface AdminConsoleProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  schedule: ScheduleItem[];
  conflicts: Conflict[];
  updateSchedule: (newSchedule: ScheduleItem[]) => void;
  resources: Resource[];
  setResources: React.Dispatch<React.SetStateAction<Resource[]>>;
  onCreateNotification: (message: string, type: Notification['type']) => void;
}

interface ConflictResolutionModalProps {
    item: ScheduleItem;
    conflicts: Conflict[];
    schedule: ScheduleItem[];
    resources: Resource[];
    onUpdateItem: (updatedItem: ScheduleItem) => void;
    onClose: () => void;
}

const ConflictResolutionModal: React.FC<ConflictResolutionModalProps> = ({ item, conflicts, schedule, resources, onUpdateItem, onClose }) => {
    const [editedItem, setEditedItem] = useState<ScheduleItem>(item);

    useEffect(() => {
        setEditedItem(item);
    }, [item]);

    const handleSave = () => {
        onUpdateItem(editedItem);
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedItem(prev => ({ ...prev, [name]: value }));
    };

    const availableRooms = useMemo(() => {
        const bookedRoomIds = new Set(
            schedule
                .filter(i => i.day === editedItem.day && i.startTime === editedItem.startTime && i.id !== editedItem.id)
                .map(i => i.roomId)
        );
        return resources.filter(r => r.type === 'Room' && !bookedRoomIds.has(r.id));
    }, [editedItem.day, editedItem.startTime, schedule, resources, editedItem.id]);

    const isCurrentRoomAvailable = availableRooms.some(r => r.id === editedItem.roomId);
    const roomForEditedItem = resources.find(r => r.id === editedItem.roomId);

    const selectStyles = "mt-1 block w-full pl-3 pr-10 py-3 text-base bg-zinc-700/50 border border-zinc-600 text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-3xl";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity p-4">
            <div className="bg-zinc-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl w-full max-w-2xl transform transition-all border border-zinc-700">
                <div className="flex justify-between items-center mb-4 border-b border-zinc-700 pb-2">
                    <h3 className="text-xl font-bold text-red-400">Resolve Conflict</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl font-bold">&times;</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-white mb-2">Conflict Details</h4>
                        <div className="mb-4 text-gray-300">
                            <p><span className="font-semibold text-gray-100">Class:</span> {item.subject} for {item.studentGroup}</p>
                            <p><span className="font-semibold text-gray-100">Time:</span> {item.day} at {item.startTime}</p>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                            {conflicts.map((conflict, index) => (
                                <div key={index} className="bg-red-500/15 p-3 rounded-3xl border border-red-500/30">
                                    <p className="font-semibold text-red-300 text-sm">{conflict.message}</p>
                                    {conflict.suggestions && conflict.suggestions.length > 0 && (
                                        <div className="mt-2">
                                            <p className="text-xs font-medium text-gray-300">Suggestions:</p>
                                            <ul className="list-disc pl-4 text-xs text-gray-400 mt-1 space-y-1">
                                                {conflict.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-white mb-2">Reschedule Class</h4>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="day-select" className="block text-sm font-medium text-gray-300">Day</label>
                                <select id="day-select" name="day" value={editedItem.day} onChange={handleChange} className={selectStyles}>
                                    {DAYS_OF_WEEK.map(day => <option key={day} value={day}>{day}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="time-select" className="block text-sm font-medium text-gray-300">Time</label>
                                <select id="time-select" name="startTime" value={editedItem.startTime} onChange={handleChange} className={selectStyles}>
                                    {TIME_SLOTS.slice(0, -1).map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="room-select" className="block text-sm font-medium text-gray-300">Room</label>
                                <select id="room-select" name="roomId" value={editedItem.roomId} onChange={handleChange} className={`${selectStyles} ${!isCurrentRoomAvailable ? 'bg-red-500/15 border-red-500/50' : ''}`}>
                                    {!isCurrentRoomAvailable && roomForEditedItem && (
                                        <option value={editedItem.roomId}>
                                            {roomForEditedItem.name} (Booked)
                                        </option>
                                    )}
                                    {availableRooms.map(room => (
                                        <option key={room.id} value={room.id}>{room.name}</option>
                                    ))}
                                    {availableRooms.length === 0 && !isCurrentRoomAvailable && <option value="">No rooms available</option>}
                                </select>
                                {!isCurrentRoomAvailable && <p className="text-xs text-red-400 mt-1">This room is not available at the selected time. Please choose another.</p>}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-6 py-3 bg-zinc-600 text-white font-semibold rounded-3xl hover:bg-zinc-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-zinc-400 transition-colors">Cancel</button>
                    <button onClick={handleSave} disabled={!isCurrentRoomAvailable} className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-3xl hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-emerald-500 disabled:bg-emerald-800/50 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const AdminConsole: React.FC<AdminConsoleProps> = ({ departments, setDepartments, schedule, conflicts, updateSchedule, resources, setResources, onCreateNotification }) => {
    const {
        constraints, setConstraints,
        isLoading,
        error,
        isListening,
        selectedGroup, setSelectedGroup,
        adminCommand, setAdminCommand,
        isAiProcessing,
        aiError, setAiError,
        aiSuccess,
        handleGenerate,
        handleAdminCommand,
        toggleListening,
    } = useAdminConsole({
        initialDepartments: departments,
        onDepartmentsChange: setDepartments,
        onScheduleUpdate: updateSchedule,
        resources: resources,
        onResourcesChange: setResources,
    });
    
    const [conflictingItem, setConflictingItem] = useState<ScheduleItem | null>(null);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState<Notification['type']>('Info');

    const studentGroupsInSchedule = useMemo(() => {
        if (!schedule || schedule.length === 0) return [];
        const groups = new Set(schedule.map(item => item.studentGroup));
        return Array.from(groups).sort();
    }, [schedule]);

    useEffect(() => {
        if (studentGroupsInSchedule.length > 0 && !studentGroupsInSchedule.includes(selectedGroup) && selectedGroup !== 'All Groups') {
            setSelectedGroup('All Groups');
        } else if (studentGroupsInSchedule.length === 0 && selectedGroup !== 'All Groups') {
            setSelectedGroup('All Groups');
        }
    }, [studentGroupsInSchedule, selectedGroup, setSelectedGroup]);


    const handleItemClick = (item: ScheduleItem) => {
        const itemConflicts = conflicts.filter(c => c.itemId === item.id);
        if (itemConflicts.length > 0) {
            setConflictingItem(item);
        }
    };
    
    const handleUpdateScheduleItem = (updatedItem: ScheduleItem) => {
        updateSchedule(schedule.map(item => item.id === updatedItem.id ? updatedItem : item));
        setConflictingItem(null);
    };

    const handleSendNotification = () => {
        if (!notificationMessage.trim()) return;
        onCreateNotification(notificationMessage, notificationType);
        setNotificationMessage('');
        setNotificationType('Info');
    };

    const filteredSchedule = selectedGroup === 'All Groups'
        ? schedule
        : schedule.filter(item => item.studentGroup === selectedGroup);
    
    const formInputStyles = "block w-full rounded-3xl bg-zinc-700/50 border border-zinc-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-3 py-2 sm:px-4 sm:py-3";

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <DashboardCard title="Attendance Status" icon={<AttendanceIcon />} variant="light">
                    <div className="space-y-4">
                        <div>
                            <p className="font-semibold text-emerald-100">Students</p>
                            <div className="flex justify-between items-center text-sm text-emerald-200"><span>Present: <span className="font-bold text-green-300">480</span></span><span>Absent: <span className="font-bold text-red-400">15</span></span></div>
                        </div>
                        <hr className="border-emerald-500/20"/>
                        <div>
                            <p className="font-semibold text-emerald-100">Teachers</p>
                            <div className="flex justify-between items-center text-sm text-emerald-200"><span>Present: <span className="font-bold text-green-300">35</span></span><span>Absent: <span className="font-bold text-red-400">2</span></span></div>
                        </div>
                        <hr className="border-emerald-500/20"/>
                        <div>
                        <p className="font-semibold text-emerald-100">Non-Teaching Staff</p>
                            <div className="flex justify-between items-center text-sm text-emerald-200"><span>Present: <span className="font-bold text-green-300">22</span></span><span>Absent: <span className="font-bold text-red-400">1</span></span></div>
                        </div>
                    </div>
                </DashboardCard>
                <DashboardCard title="AI Command Center" icon={<AiIcon />} className="lg:col-span-2">
                    <div className="space-y-3">
                        <p className="text-sm text-gray-400">
                            Use natural language to manage the school. The AI will parse your command and perform the required actions, including updating timetable constraints.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                            <input
                                type="text"
                                value={adminCommand}
                                onChange={e => setAdminCommand(e.target.value)}
                                placeholder="e.g., Create 'AIML' dept..."
                                className={`${formInputStyles} flex-grow`}
                                disabled={isAiProcessing}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdminCommand()}
                            />
                            <button 
                                onClick={handleAdminCommand} 
                                disabled={isAiProcessing || !adminCommand.trim()} 
                                className="px-4 py-2 sm:px-6 sm:py-3 bg-emerald-600 text-white font-semibold rounded-3xl hover:bg-emerald-700 disabled:bg-emerald-800/50 disabled:text-gray-400 transition sm:w-32 flex justify-center items-center"
                            >
                                {isAiProcessing ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Execute'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            <b>Examples:</b> "Add room 607.", "Create Science department.", "Create student group Grade 9.", "Add Prakash to AIML as teaching staff.", "Set class duration to 50 minutes."
                        </p>
                    </div>
                </DashboardCard>
            </div>

            <DashboardCard title="Create Notification" icon={<NotificationIcon />}>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="notification-message" className="block text-sm font-medium text-gray-300">
                            Notification Message
                        </label>
                        <textarea
                            id="notification-message"
                            rows={3}
                            className={`mt-1 ${formInputStyles}`}
                            placeholder="e.g., The school will be closed on Monday for a public holiday."
                            value={notificationMessage}
                            onChange={(e) => setNotificationMessage(e.target.value)}
                        ></textarea>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                        <div className="flex-grow">
                             <label htmlFor="notification-type" className="block text-sm font-medium text-gray-300">
                                Alert Level
                            </label>
                            <select
                                id="notification-type"
                                className={`mt-1 py-2 sm:py-3 pl-4 pr-10 ${formInputStyles} appearance-none`}
                                value={notificationType}
                                onChange={(e) => setNotificationType(e.target.value as Notification['type'])}
                            >
                                <option>Info</option>
                                <option>Warning</option>
                                <option>Urgent</option>
                            </select>
                        </div>
                        <div className="self-end w-full sm:w-auto">
                            <button
                                onClick={handleSendNotification}
                                disabled={!notificationMessage.trim()}
                                className="w-full sm:w-auto inline-flex justify-center rounded-3xl border border-transparent bg-emerald-600 py-2 sm:py-3 px-6 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:bg-emerald-800/50 disabled:text-gray-400 transition-colors"
                            >
                                Send Notification
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <DashboardCard title="Timetable Generator" icon={<GeneratorIcon />}>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Constraints & Preferences</label>
                            <p className="text-xs text-gray-500 mb-1">Use the AI Command Center to add rules here.</p>
                            <textarea
                                value={constraints}
                                onChange={(e) => setConstraints(e.target.value)}
                                rows={8}
                                className={`w-full mt-1 shadow-sm ${formInputStyles}`}
                                placeholder="e.g., Physics requires Lab A."
                            />
                        </div>
                        {error && <p className="text-sm text-red-300 bg-red-900/50 p-2 rounded-md">{error}</p>}
                        <div className="flex space-x-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="w-full flex-grow justify-center py-2 px-4 sm:py-3 border border-transparent rounded-3xl shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 disabled:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 focus:ring-emerald-500 flex justify-center items-center"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : 'Generate Draft'}
                            </button>
                             <button
                                onClick={toggleListening}
                                className={`p-3 rounded-3xl ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-zinc-600 text-gray-200 hover:bg-zinc-500'}`}
                                aria-label="Toggle voice input"
                            >
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-14 0m7 10v-2m0 0a3 3 0 00-3-3H9m6 0a3 3 0 00-3 3h0" /></svg>
                             </button>
                        </div>
                    </div>
                </DashboardCard>

                <DashboardCard title="School Resources" icon={<ManageIcon />} className="lg:col-span-2">
                    <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2">
                        <div>
                            <h4 className="font-bold text-lg text-white mb-2">Departments & Staff</h4>
                            {departments.length === 0 && <p className="text-sm text-gray-500">No departments created yet.</p>}
                            {departments.map(dept => (
                                <details key={dept.id} className="p-3 bg-zinc-700/30 rounded-3xl mb-2" open>
                                    <summary className="font-semibold cursor-pointer list-none flex justify-between text-gray-200">
                                        <span>{dept.name}</span>
                                        <span className="text-gray-400 text-sm">
                                            {dept.teachingStaff.length} T, {dept.nonTeachingStaff.length} NT
                                        </span>
                                    </summary>
                                    <div className="mt-2 pl-4 text-sm text-gray-300">
                                        <p className="font-semibold">Teaching:</p>
                                        <ul className="list-disc pl-5">
                                            {dept.teachingStaff.map(s => <li key={s.id}>{s.name}</li>)}
                                            {dept.teachingStaff.length === 0 && <li className="text-gray-500 italic">None</li>}
                                        </ul>
                                    </div>
                                </details>
                            ))}
                        </div>
                        <div className="border-t border-zinc-700 pt-4">
                            <h4 className="font-bold text-lg text-white mb-2">Rooms</h4>
                            {resources.filter(r => r.type === 'Room').length === 0 && <p className="text-sm text-gray-500">No rooms created yet.</p>}
                            <ul className="list-disc pl-5 text-sm text-gray-300 columns-1 sm:columns-2">
                                {resources.filter(r => r.type === 'Room').map(res => <li key={res.id}>{res.name}{res.capacity ? ` (Cap: ${res.capacity})` : ''}</li>)}
                            </ul>
                        </div>
                         <div className="border-t border-zinc-700 pt-4">
                            <h4 className="font-bold text-lg text-white mb-2">Student Groups</h4>
                            {resources.filter(r => r.type === 'StudentGroup').length === 0 && <p className="text-sm text-gray-500">No student groups created yet.</p>}
                            <ul className="list-disc pl-5 text-sm text-gray-300 columns-1 sm:columns-2">
                                {resources.filter(r => r.type === 'StudentGroup').map(res => <li key={res.id}>{res.name}</li>)}
                            </ul>
                        </div>
                    </div>
                </DashboardCard>
            </div>
            
            {aiSuccess && (
                <div className="bg-green-500/15 border border-green-500/30 text-green-300 px-4 py-3 rounded-3xl relative" role="alert">
                    <strong className="font-bold">AI Assistant: </strong>
                    <span className="block sm:inline">{aiSuccess}</span>
                </div>
            )}
            {(aiError) && 
                <div className="bg-red-500/15 border border-red-500/30 text-red-300 px-4 py-3 rounded-3xl relative" role="alert">
                    <strong className="font-bold">AI Assistant Error: </strong>
                    <span className="block sm:inline">{aiError}</span>
                    <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setAiError(null)}>
                        <svg className="fill-current h-6 w-6 text-red-400" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                    </span>
                </div>
            }

            <DashboardCard title={`Generated Timetable Draft ${selectedGroup !== 'All Groups' ? `for ${selectedGroup}` : ''}`}>
                 <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center mb-4 -mt-12">
                     <div>
                        <label htmlFor="admin-group-select" className="sr-only">Select Class</label>
                        <select
                            id="admin-group-select"
                            value={selectedGroup}
                            onChange={(e) => setSelectedGroup(e.target.value)}
                            disabled={studentGroupsInSchedule.length === 0}
                            className="bg-zinc-700/50 border border-zinc-600 text-white rounded-3xl py-3 px-5 appearance-none pr-10 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-zinc-800 disabled:cursor-not-allowed w-full"
                        >
                            <option value="All Groups">All Groups</option>
                            {studentGroupsInSchedule.map(group => (
                                <option key={group} value={group}>{group}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <TimetableView 
                    schedule={filteredSchedule} 
                    conflicts={conflicts}
                    onItemClick={handleItemClick} 
                />
            </DashboardCard>
            {conflictingItem && (
                <ConflictResolutionModal
                    item={conflictingItem}
                    conflicts={conflicts.filter(c => c.itemId === conflictingItem.id)}
                    schedule={schedule}
                    resources={resources}
                    onUpdateItem={handleUpdateScheduleItem}
                    onClose={() => setConflictingItem(null)}
                />
            )}
        </div>
    );
};

export default AdminConsole;