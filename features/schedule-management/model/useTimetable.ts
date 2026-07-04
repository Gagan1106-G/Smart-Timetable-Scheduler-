import { useState, useEffect, useCallback } from 'react';
import { ScheduleItem, Conflict } from '../../../entities/schedule';
import { Resource } from '../../../entities/resource';
import { MOCK_SCHEDULE } from '../../../shared/config';
import { detectConflicts as detectConflictsFunc } from '../../detect-conflicts';


export const useTimetable = (initialSchedule: ScheduleItem[] = MOCK_SCHEDULE, resources: Resource[]) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  const detectConflicts = useCallback((currentSchedule: ScheduleItem[]) => {
    const newConflicts = detectConflictsFunc(currentSchedule, resources);
    setConflicts(newConflicts);
  }, [resources]);

  useEffect(() => {
    detectConflicts(schedule);
  }, [schedule, detectConflicts]);

  const updateSchedule = (newSchedule: ScheduleItem[]) => {
    setSchedule(newSchedule);
  };
  
  const addScheduleItem = (item: Omit<ScheduleItem, 'id'>) => {
    const newItem = { ...item, id: new Date().toISOString() };
    setSchedule(prev => [...prev, newItem]);
  }

  return { schedule, conflicts, updateSchedule, addScheduleItem };
};
