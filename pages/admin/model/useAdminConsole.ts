
// FIX: Import React to resolve 'Cannot find namespace React' error.
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateTimetable, processAdminCommand } from '../../../features/generate-timetable';
import { ScheduleItem } from '../../../entities/schedule';
import { Resource } from '../../../entities/resource';
import { Department, StaffMember } from '../../../entities/staff';

interface AdminConsoleHookProps {
    initialDepartments: Department[];
    onDepartmentsChange: React.Dispatch<React.SetStateAction<Department[]>>;
    onScheduleUpdate: (newSchedule: ScheduleItem[]) => void;
    resources: Resource[];
    onResourcesChange: React.Dispatch<React.SetStateAction<Resource[]>>;
}

export const useAdminConsole = ({ initialDepartments, onDepartmentsChange, onScheduleUpdate, resources, onResourcesChange }: AdminConsoleHookProps) => {
    const [constraints, setConstraints] = useState('- All classes are 1 hour long.\n- Lunch break is from 12:00 to 13:00.');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const [selectedGroup, setSelectedGroup] = useState<string>('All Groups');
    const [adminCommand, setAdminCommand] = useState('');
    const [isAiProcessing, setIsAiProcessing] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [aiSuccess, setAiSuccess] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const allTeachers = initialDepartments.flatMap(d => d.teachingStaff.map(s => s.name));
            if (allTeachers.length === 0) {
                 setError("Please add at least one teacher before generating a schedule.");
                 setIsLoading(false);
                 return;
            }
            const newSchedule = await generateTimetable(constraints, resources, allTeachers);
            onScheduleUpdate(newSchedule);
        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    }, [constraints, initialDepartments, resources, onScheduleUpdate]);
    
    const handleAdminCommand = async () => {
        if (!adminCommand.trim()) return;
        setIsAiProcessing(true);
        setAiError(null);
        setAiSuccess(null);
        try {
            const actions = await processAdminCommand(adminCommand);
            let updatedDepartments = [...initialDepartments];
            let updatedResources = [...resources];
            const processingErrors: string[] = [];

            actions.forEach(action => {
                switch (action.action) {
                    case 'create_department':
                        if (action.name) {
                            if (updatedDepartments.some(d => d.name.toLowerCase() === action.name.toLowerCase())) {
                                processingErrors.push(`Department "${action.name}" already exists.`);
                            } else {
                                updatedDepartments.push({ id: crypto.randomUUID(), name: action.name, teachingStaff: [], nonTeachingStaff: [] });
                            }
                        }
                        break;
                    case 'add_teaching_staff':
                        if (action.departmentName && action.staffName) {
                            let departmentFound = false;
                            updatedDepartments = updatedDepartments.map(d => {
                                if (d.name.toLowerCase() === action.departmentName.toLowerCase()) {
                                    departmentFound = true;
                                    if(d.teachingStaff.some(s => s.name.toLowerCase() === action.staffName.toLowerCase())) {
                                        processingErrors.push(`Staff "${action.staffName}" already exists in "${action.departmentName}".`);
                                        return d;
                                    }
                                    const newStaff: StaffMember = { id: crypto.randomUUID(), name: action.staffName };
                                    return { ...d, teachingStaff: [...d.teachingStaff, newStaff] };
                                }
                                return d;
                            });
                            if (!departmentFound) {
                                processingErrors.push(`Cannot add staff: Department "${action.departmentName}" not found.`);
                            }
                        }
                        break;
                    case 'create_room':
                        if (action.name) {
                            if (updatedResources.some(r => r.name.toLowerCase() === action.name.toLowerCase())) {
                                processingErrors.push(`Room "${action.name}" already exists.`);
                            } else {
                                 const newRoom: Resource = { 
                                     id: crypto.randomUUID(), 
                                     name: action.name, 
                                     type: 'Room' 
                                 };
                                 if (action.capacity && typeof action.capacity === 'number') {
                                     newRoom.capacity = action.capacity;
                                 }
                                 updatedResources.push(newRoom);
                            }
                        }
                        break;
                    case 'create_student_group':
                        if (action.name) {
                            if (updatedResources.some(r => r.name.toLowerCase() === action.name.toLowerCase() && r.type === 'StudentGroup')) {
                                processingErrors.push(`Student group "${action.name}" already exists.`);
                            } else {
                                const newGroup: Resource = {
                                    id: crypto.randomUUID(),
                                    name: action.name,
                                    type: 'StudentGroup'
                                };
                                updatedResources.push(newGroup);
                            }
                        }
                        break;
                    case 'set_constraint':
                        if (action.detail) {
                            setConstraints(currentConstraints => `${currentConstraints}\n- ${action.detail}`);
                        }
                        break;
                }
            });
            
            if (processingErrors.length > 0) {
                setAiError(processingErrors.join(' '));
            } else if (actions.length > 0) {
                 setAiSuccess('Command processed successfully!');
                 setTimeout(() => setAiSuccess(null), 4000);
            }

            onDepartmentsChange(updatedDepartments);
            onResourcesChange(updatedResources);
            setAdminCommand('');
        } catch (e: any) {
            setAiError(e.message || "An AI error occurred.");
        } finally {
            setIsAiProcessing(false);
        }
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech recognition is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript.trim() + '. ';
                }
            }
            if (finalTranscript) {
                setConstraints(prev => prev + '\n- ' + finalTranscript);
            }
        };
        
        recognition.onerror = (event: any) => {
            if (event.error === 'no-speech' || event.error === 'audio-capture') return;
            console.error("Speech recognition error:", event.error);
            setIsListening(false);
        };
        
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, []);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;
        if (isListening) {
            recognition.start();
            recognition.onend = () => { if (isListening) recognition.start(); };
        } else {
            recognition.onend = null;
            recognition.stop();
        }
        return () => { if (recognition) { recognition.onend = null; } }
    }, [isListening]);

    const toggleListening = () => setIsListening(prev => !prev);
    
    return {
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
    };
};
