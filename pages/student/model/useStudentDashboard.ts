

import { useState, useMemo, useEffect } from 'react';
import { ScheduleItem } from '../../../entities/schedule';

export const useStudentDashboard = (schedule: ScheduleItem[]) => {
    const studentGroupsInSchedule = useMemo(() => {
        if (!schedule || schedule.length === 0) return [];
        const groups = new Set(schedule.map(item => item.studentGroup));
        return Array.from(groups).sort();
    }, [schedule]);
    
    const [selectedGroup, setSelectedGroup] = useState<string>('');

    useEffect(() => {
        // When the list of available groups changes...
        if (studentGroupsInSchedule.length > 0) {
            // ...if the currently selected group is not in the new list, select the first available one.
            if (!studentGroupsInSchedule.includes(selectedGroup)) {
                setSelectedGroup(studentGroupsInSchedule[0]);
            }
        } else {
            // ...if there are no groups, clear the selection.
            setSelectedGroup('');
        }
    }, [studentGroupsInSchedule]);


    const today = useMemo(() => new Date().toLocaleDateString('en-US', { weekday: 'long' }), []);

    const todaysClasses = useMemo(() => schedule
        .filter(item => item.day === today && item.studentGroup === selectedGroup)
        .sort((a,b) => a.startTime.localeCompare(b.startTime)), [schedule, today, selectedGroup]);
        
    const groupSchedule = useMemo(() => schedule.filter(i => i.studentGroup === selectedGroup), [schedule, selectedGroup]);

    return {
        selectedGroup,
        setSelectedGroup,
        todaysClasses,
        groupSchedule,
        studentGroupsInSchedule,
    };
};
