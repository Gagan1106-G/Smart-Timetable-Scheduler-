
import React from 'react';
import { ScheduleItem, Conflict, DayOfWeek } from '../../../entities/schedule';
import { TIME_SLOTS, DAYS_OF_WEEK } from '../../../shared/config';


interface TimetableViewProps {
  schedule: ScheduleItem[];
  conflicts: Conflict[];
  onCellClick?: (day: DayOfWeek, time: string) => void;
  onItemClick?: (item: ScheduleItem) => void;
  viewMode?: 'grid' | 'list';
}

// Deterministic color generation for subjects
const stringToHash = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

const PALETTE = [
  { bg: 'bg-emerald-900/50', border: 'border-emerald-500', text: 'text-emerald-200' },
  { bg: 'bg-sky-900/50', border: 'border-sky-500', text: 'text-sky-200' },
  { bg: 'bg-violet-900/50', border: 'border-violet-500', text: 'text-violet-200' },
  { bg: 'bg-amber-900/50', border: 'border-amber-500', text: 'text-amber-200' },
  { bg: 'bg-rose-900/50', border: 'border-rose-500', text: 'text-rose-200' },
  { bg: 'bg-cyan-900/50', border: 'border-cyan-500', text: 'text-cyan-200' },
  { bg: 'bg-fuchsia-900/50', border: 'border-fuchsia-500', text: 'text-fuchsia-200' },
];

const getSubjectColor = (subject: string) => {
  const hash = stringToHash(subject);
  const index = Math.abs(hash) % PALETTE.length;
  return PALETTE[index];
};


const ScheduleItemCard: React.FC<{ item: ScheduleItem; conflicts: Conflict[]; onClick?: (item: ScheduleItem) => void }> = ({ item, conflicts, onClick }) => {
    const itemConflicts = conflicts.filter(c => c.itemId === item.id);
    const hasConflict = itemConflicts.length > 0;
    const color = getSubjectColor(item.subject);

    return (
        <div 
            onClick={() => onClick && onClick(item)}
            className={`rounded-lg p-2 text-xs shadow-sm hover:shadow-md transition-all cursor-pointer relative border-l-4 ${color.bg} ${color.border} ${hasConflict ? 'ring-2 ring-red-400 ring-offset-2 ring-offset-zinc-800' : ''}`}
            title={itemConflicts.map(c => c.message).join('\n')}
        >
            <p className="font-semibold text-gray-100">{item.subject}</p>
            <p className="text-gray-300">{item.teacher}</p>
            <p className="text-gray-400">{item.roomId}</p>
            {hasConflict && (
                <div className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-zinc-800" />
            )}
        </div>
    );
};

const GridView: React.FC<Omit<TimetableViewProps, 'viewMode'>> = ({ schedule, conflicts, onCellClick, onItemClick }) => (
    <div className="bg-transparent p-4 rounded-lg overflow-x-auto w-full">
        <div className="grid grid-cols-[120px_repeat(5,1fr)] min-w-[900px] sm:min-w-full gap-[1px] border border-zinc-700 rounded-xl overflow-hidden">
            {/* Header: Time */}
            <div className="text-center font-semibold p-2 border-b border-r border-zinc-700 text-gray-400">Time</div>
            {/* Header: Days */}
            {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-center font-semibold p-2 border-b border-zinc-700 text-gray-400">
                    <span className="hidden sm:inline">{day}</span>
                    <span className="sm:hidden">{day.slice(0,3)}</span>
                </div>
            ))}

            {/* Timetable Body */}
            {TIME_SLOTS.slice(0, -1).map((time, timeIndex) => (
                <React.Fragment key={time}>
                    {/* Time Column */}
                    <div className="text-center font-medium p-2 border-r border-zinc-700 text-sm text-gray-500">{`${time} - ${TIME_SLOTS[timeIndex+1]}`}</div>
                    {/* Schedule Cells */}
                    {DAYS_OF_WEEK.map(day => {
                        const itemsInSlot = schedule.filter(item => item.day === day && item.startTime === time);
                        return (
                            <div
                                key={`${day}-${time}`}
                                className="border-b border-zinc-700 p-2 h-24 sm:h-28 hover:bg-zinc-800/30 transition-colors duration-200"
                                onClick={() => onCellClick && onCellClick(day, time)}
                            >
                                <div className="space-y-1">
                                    {itemsInSlot.map(item => (
                                        <ScheduleItemCard 
                                            key={item.id} 
                                            item={item} 
                                            conflicts={conflicts} 
                                            onClick={onItemClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </React.Fragment>
            ))}
        </div>
    </div>
);


const ListView: React.FC<Omit<TimetableViewProps, 'viewMode'>> = ({ schedule, onItemClick }) => {
    const scheduleByDay = DAYS_OF_WEEK.map(day => ({
        day,
        items: schedule.filter(item => item.day === day).sort((a,b) => a.startTime.localeCompare(b.startTime)),
    }));

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {scheduleByDay.map(({ day, items }) => (
                <div key={day} className="bg-zinc-800/50 border border-zinc-700/80 text-white rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-gray-200">{day}</p>
                        <span className="text-xs text-gray-400">{items.length} classes</span>
                    </div>
                    <div className="mt-3 space-y-2">
                         {items.length === 0 && <p className="text-gray-500 text-sm py-4 text-center">No classes.</p>}
                        {items.map(item => {
                            const color = getSubjectColor(item.subject);
                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => onItemClick && onItemClick(item)}
                                    className={`rounded-xl px-3 py-2 text-sm cursor-pointer hover:bg-zinc-700/50 transition-colors border-l-4 ${color.border} ${color.bg}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-200">{item.subject}</span>
                                        <span className="text-gray-400">{item.startTime}</span>
                                    </div>
                                    <div className="text-gray-300 text-xs mt-1">
                                        {item.teacher} &middot; {item.roomId}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};


const TimetableView: React.FC<TimetableViewProps> = ({ viewMode = 'grid', ...props }) => {
    if (viewMode === 'list') {
        return <ListView {...props} />;
    }
    return <GridView {...props} />;
};

export default React.memo(TimetableView);