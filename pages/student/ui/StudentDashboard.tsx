
import React from 'react';
import DashboardCard from '../../../shared/ui/card';
import TimetableView from '../../../widgets/timetable';
import { ScheduleItem, Conflict } from '../../../entities/schedule';
import { useStudentDashboard } from '../model/useStudentDashboard';
import { Notification } from '../../../entities/notification';


const TodayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const AlertIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const AttendanceIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>

interface StudentDashboardProps {
  schedule: ScheduleItem[];
  conflicts: Conflict[];
  notifications: Notification[];
}

const TodaysClasses: React.FC<{ classes: ScheduleItem[] }> = ({ classes }) => {
    if (classes.length === 0) {
        return <p className="text-emerald-200/60">No classes scheduled for today.</p>;
    }
    return (
        <ul className="space-y-3">
            {classes.map(item => (
                <li key={item.id} className={`p-3 rounded-lg flex justify-between items-center bg-emerald-500/10`}>
                    <div>
                        <p className="font-semibold text-emerald-100">{item.subject}</p>
                        <p className="text-sm text-emerald-200/80">{item.teacher} - {item.roomId}</p>
                    </div>
                    <div className="font-medium text-sm text-emerald-200">{item.startTime}</div>
                </li>
            ))}
        </ul>
    );
};

const getNotificationStyle = (type: Notification['type']): string => {
    switch (type) {
        case 'Urgent':
            return 'bg-red-500/15 text-red-100';
        case 'Warning':
            return 'bg-yellow-500/15 text-yellow-100';
        case 'Info':
        default:
            return 'bg-blue-500/15 text-blue-100';
    }
}

const AttendanceChart: React.FC = () => {
    const attendanceData = [
        { day: 'Mon', present: 95 },
        { day: 'Tue', present: 100 },
        { day: 'Wed', present: 90 },
        { day: 'Thu', present: 100 },
        { day: 'Fri', present: 85 },
    ];
    return (
        <div className="flex justify-around items-end h-32 pt-4">
            {attendanceData.map(item => (
                <div key={item.day} className="text-center w-8 flex flex-col items-center justify-end">
                    <div className="text-xs text-emerald-100 mb-1">{item.present}%</div>
                    <div className="bg-emerald-400/80 rounded-t-md w-full" style={{ height: `${item.present * 0.8}%` }}></div>
                    <span className="text-xs font-medium text-emerald-200/80 mt-1">{item.day}</span>
                </div>
            ))}
        </div>
    );
};

const StudentDashboard: React.FC<StudentDashboardProps> = ({ schedule, conflicts, notifications }) => {
  const {
    selectedGroup,
    setSelectedGroup,
    todaysClasses,
    groupSchedule,
    studentGroupsInSchedule,
  } = useStudentDashboard(schedule);
  
  const unreadNotifications = notifications
    .filter(n => !n.read)
    .sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-white">Hi Student,</h1>
            <p className="text-gray-400 mt-1">Here’s your overview for {selectedGroup}.</p>
        </div>
        <div>
            <label htmlFor="group-select" className="sr-only">Select Class</label>
            <select
                id="group-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                disabled={studentGroupsInSchedule.length === 0}
                className="bg-zinc-700/50 border border-zinc-600 text-white rounded-3xl py-3 px-5 appearance-none pr-10 cursor-pointer focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-zinc-800 disabled:cursor-not-allowed"
            >
                {studentGroupsInSchedule.length === 0 && <option>No schedule found</option>}
                {studentGroupsInSchedule.map(group => (
                    <option key={group} value={group}>{group}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DashboardCard title={`${todaysClasses.length} Classes Today`} icon={<TodayIcon />} variant="light" className="lg:col-span-1">
            <TodaysClasses classes={todaysClasses} />
        </DashboardCard>

        <DashboardCard title="Alerts & Notifications" icon={<AlertIcon />} className="lg:col-span-1">
            {unreadNotifications.length > 0 ? (
                <ul className="space-y-3">
                    {unreadNotifications.slice(0, 3).map(n => (
                        <li key={n.id} className={`text-sm p-3 rounded-3xl ${getNotificationStyle(n.type)}`}>
                            <p className="font-semibold">{n.message}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-400">No new notifications.</p>
            )}
        </DashboardCard>

        <DashboardCard title="Attendance This Week" icon={<AttendanceIcon />} variant="light" className="lg:col-span-1">
            <AttendanceChart />
        </DashboardCard>
      </div>

      <DashboardCard title={`Weekly Timetable for ${selectedGroup}`}>
        <TimetableView schedule={groupSchedule} conflicts={conflicts} viewMode="list" />
      </DashboardCard>
    </div>
  );
};

export default StudentDashboard;