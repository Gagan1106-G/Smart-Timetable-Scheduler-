import { ScheduleItem, Conflict } from '../../../entities/schedule';
import { Resource } from '../../../entities/resource';
import { TIME_SLOTS } from '../../../shared/config';

export const detectConflicts = (currentSchedule: ScheduleItem[], resources: Resource[]): Conflict[] => {
    const newConflicts: Conflict[] = [];
    const scheduleByTime: Record<string, ScheduleItem[]> = {};

    currentSchedule.forEach(item => {
      const key = `${item.day}-${item.startTime}`;
      if (!scheduleByTime[key]) {
        scheduleByTime[key] = [];
      }
      scheduleByTime[key].push(item);
    });

    for (const key in scheduleByTime) {
      const items = scheduleByTime[key];
      if (items.length > 1) {
        const teacherCounts: Record<string, string[]> = {};
        const roomCounts: Record<string, string[]> = {};
        const groupCounts: Record<string, string[]> = {};

        items.forEach(item => {
          if (!teacherCounts[item.teacher]) teacherCounts[item.teacher] = [];
          teacherCounts[item.teacher].push(item.id);

          if (!roomCounts[item.roomId]) roomCounts[item.roomId] = [];
          roomCounts[item.roomId].push(item.id);
          
          if (!groupCounts[item.studentGroup]) groupCounts[item.studentGroup] = [];
          groupCounts[item.studentGroup].push(item.id);
        });

        Object.entries(teacherCounts).forEach(([teacher, ids]) => {
          if (ids.length > 1) {
            const conflictingItems = items.filter(item => item.teacher === teacher);
            const conflictingDay = conflictingItems[0].day;
            const teacherBookedSlots = new Set(currentSchedule.filter(i => i.teacher === teacher && i.day === conflictingDay).map(i => i.startTime));
            const nextFreeSlot = TIME_SLOTS.find(slot => new Date(`1970-01-01T${slot}:00`) > new Date(`1970-01-01T${conflictingItems[0].startTime}:00`) && !teacherBookedSlots.has(slot));
            
            const suggestions = [`Check ${teacher}'s schedule for an open slot.`];
            if (nextFreeSlot) {
                suggestions.push(`Try moving one class to ${nextFreeSlot} on ${conflictingDay}.`);
            }
            
            const conflictingSubjects = conflictingItems.map(i => `'${i.subject}'`).join(' and ');
            const message = `Teacher ${teacher} is double-booked with ${conflictingSubjects}.`;

            ids.forEach(id => newConflicts.push({ itemId: id, message, suggestions }));
          }
        });

        Object.entries(roomCounts).forEach(([room, ids]) => {
          if (ids.length > 1) {
            const conflictingItems = items.filter(i => i.roomId === room);
            const conflictingDay = conflictingItems[0].day;
            const conflictingTime = conflictingItems[0].startTime;

            const allRooms = resources.filter(r => r.type === 'Room');
            const conflictingRoomDetails = resources.find(r => r.id === room);
            
            const bookedRoomIdsAtTime = new Set(
                currentSchedule
                    .filter(i => i.day === conflictingDay && i.startTime === conflictingTime)
                    .map(i => i.roomId)
            );
            
            const availableRooms = allRooms.filter(r => {
                if (bookedRoomIdsAtTime.has(r.id)) return false; // Exclude all booked rooms
                if (conflictingRoomDetails?.capacity) {
                    // Suggest rooms with at least the same capacity
                    return r.capacity && r.capacity >= conflictingRoomDetails.capacity;
                }
                return true; // If original room has no capacity, any empty room is fine
            });
            
            let suggestions: string[] = [];
            if (availableRooms.length > 0) {
                 const suggestionString = availableRooms
                    .map(r => `${r.name}${r.capacity ? ` (Cap: ${r.capacity})` : ''}`)
                    .slice(0, 3)
                    .join(', ');
                suggestions.push(`Try moving to: ${suggestionString}.`);
            } else {
                suggestions.push('No suitable alternative rooms available at this time. Consider rescheduling one class.');
            }
            
            const conflictingSubjectsAndTeachers = conflictingItems.map(i => `'${i.subject}' (${i.teacher})`).join(' and ');
            const roomName = conflictingRoomDetails?.name || room;
            const message = `Room ${roomName} is double-booked with ${conflictingSubjectsAndTeachers}.`;

            ids.forEach(id => newConflicts.push({ itemId: id, message, suggestions }));
          }
        });
        
        Object.entries(groupCounts).forEach(([group, ids]) => {
          if (ids.length > 1) {
            const conflictingItems = items.filter(item => item.studentGroup === group);
            const suggestions = [`Check the schedule for ${group} to find an open slot.`];
            const conflictingSubjects = conflictingItems.map(i => `'${i.subject}'`).join(' and ');
            const message = `Group ${group} is double-booked with ${conflictingSubjects}.`;
            ids.forEach(id => newConflicts.push({ itemId: id, message, suggestions }));
          }
        });
      }
    }
    return newConflicts;
};