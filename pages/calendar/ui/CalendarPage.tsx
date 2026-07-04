import React, { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js/dist/tesseract.min.js';

import { CalendarEvent } from '../../../entities/event';
import { UserRole } from '../../../entities/user';
import DashboardCard from '../../../shared/ui/card';
import { useCalendar } from '../model/useCalendar';

// ============================================
// Interfaces
// ============================================
interface CalendarPageProps {
  events: CalendarEvent[];
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onRemoveEvent?: (eventId: string) => void;
  onClearAllEvents?: () => void;
  currentRole: UserRole;
}

interface UploadedCalendarFile {
  id: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  totalEventsAdded: number;
  fileType: string;
  eventsPreview: CalendarEvent[];
  eventIds: string[];
}

interface ConfirmationModal {
  isOpen: boolean;
  title: string;
  message: string;
  confirmAction: () => void;
  confirmText: string;
  isDangerous?: boolean;
}

// ============================================
// Main Component
// ============================================
const CalendarPage: React.FC<CalendarPageProps> = ({
  events,
  onAddEvent,
  onRemoveEvent,
  onClearAllEvents,
  currentRole,
}) => {
  const {
    currentDate,
    time,
    isModalOpen,
    selectedDate,
    eventTitle,
    setEventTitle,
    eventTime,
    setEventTime,
    eventType,
    setEventType,
    handlePrevMonth,
    handleNextMonth,
    handleDayClick,
    handleAddEvent,
    closeModal,
    calendarGrid,
  } = useCalendar(events, onAddEvent);

  // State management
  const [uploading, setUploading] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<UploadedCalendarFile[]>(() => {
    try {
      const saved = localStorage.getItem('academicCalendarUploads');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  const [parseProgress, setParseProgress] = useState<string>('');
  const [showTeacherUploads, setShowTeacherUploads] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationModal>({
    isOpen: false,
    title: '',
    message: '',
    confirmAction: () => {},
    confirmText: 'Confirm',
    isDangerous: false,
  });
  const [selectedEventForDelete, setSelectedEventForDelete] = useState<string | null>(null);

  const formInputStyles =
    'block w-full rounded-3xl bg-zinc-700/50 border border-zinc-600 text-white shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm px-4 py-3';
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // ===============================
  // Upload History Management
  // ===============================
  const saveUploadHistory = (history: UploadedCalendarFile[]) => {
    try {
      localStorage.setItem('academicCalendarUploads', JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  };

  const getUploadStats = () => {
    return {
      totalUploads: uploadHistory.length,
      totalEventsAdded: uploadHistory.reduce((sum, upload) => sum + upload.totalEventsAdded, 0),
      lastUpload: uploadHistory[0]?.uploadedAt || null,
      fileTypes: Array.from(new Set(uploadHistory.map((u) => u.fileType))),
    };
  };

  // ===============================
  // Delete Handlers
  // ===============================

  const handleDeleteUpload = (uploadId: string) => {
    const uploadToDelete = uploadHistory.find((u) => u.id === uploadId);
    if (!uploadToDelete) return;

    setConfirmation({
      isOpen: true,
      title: 'Delete Upload Record',
      message: `Are you sure you want to delete "${uploadToDelete.fileName}"? This will also remove the ${uploadToDelete.totalEventsAdded} events added from this upload.`,
      confirmAction: () => {
        console.log('🗑️ Deleting upload:', uploadToDelete.id);
        console.log('📋 Events to delete:', uploadToDelete.eventIds);

        // Remove events that came from this upload
        uploadToDelete.eventIds.forEach((eventId) => {
          console.log('🗑️ Removing event:', eventId);
          if (onRemoveEvent) {
            onRemoveEvent(eventId);
          } else {
            console.warn('⚠️ onRemoveEvent callback not provided!');
          }
        });

        // Remove from history
        const updatedHistory = uploadHistory.filter((u) => u.id !== uploadId);
        setUploadHistory(updatedHistory);
        saveUploadHistory(updatedHistory);

        alert(`✅ Upload "${uploadToDelete.fileName}" and its events have been deleted.`);
        setConfirmation({ ...confirmation, isOpen: false });
      },
      confirmText: 'Delete',
      isDangerous: true,
    });
  };

  const handleDeleteAllUploads = () => {
    setConfirmation({
      isOpen: true,
      title: 'Clear All Upload History',
      message: `This will delete all ${uploadHistory.length} upload records and remove ALL ${getUploadStats().totalEventsAdded} events added from uploads. This action cannot be undone.`,
      confirmAction: () => {
        console.log('🗑️ Deleting all uploads');

        // Remove all events from uploads
        uploadHistory.forEach((upload) => {
          upload.eventIds.forEach((eventId) => {
            console.log('🗑️ Removing event:', eventId);
            if (onRemoveEvent) {
              onRemoveEvent(eventId);
            }
          });
        });

        setUploadHistory([]);
        saveUploadHistory([]);
        alert('✅ All upload history and associated events have been deleted.');
        setShowUploadHistory(false);
        setConfirmation({ ...confirmation, isOpen: false });
      },
      confirmText: 'Delete All',
      isDangerous: true,
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find((e) => e.id === eventId);
    if (!eventToDelete) {
      console.error('❌ Event not found:', eventId);
      return;
    }

    console.log('🗑️ Deleting event:', eventId, eventToDelete.title);

    setConfirmation({
      isOpen: true,
      title: 'Delete Event',
      message: `Are you sure you want to delete "${eventToDelete.title}" on ${new Date(eventToDelete.date).toLocaleDateString()}?`,
      confirmAction: () => {
        console.log('✅ Confirming deletion of event:', eventId);

        if (!onRemoveEvent) {
          console.error('❌ onRemoveEvent callback not provided!');
          alert('❌ Error: Cannot delete event. Callback not configured.');
          setConfirmation({ ...confirmation, isOpen: false });
          return;
        }

        // ✅ CALL THE CALLBACK TO DELETE
        onRemoveEvent(eventId);
        console.log('✅ Event removal called');

        // Remove from upload history if it exists
        const updatedHistory = uploadHistory.map((upload) => ({
          ...upload,
          eventIds: upload.eventIds.filter((id) => id !== eventId),
          totalEventsAdded: upload.eventIds.includes(eventId)
            ? upload.totalEventsAdded - 1
            : upload.totalEventsAdded,
          eventsPreview: upload.eventsPreview.filter((e) => e.id !== eventId),
        }));
        setUploadHistory(updatedHistory);
        saveUploadHistory(updatedHistory);

        setSelectedEventForDelete(null);
        setConfirmation({ ...confirmation, isOpen: false });

        // ✅ Show success message
        alert(`✅ Event "${eventToDelete.title}" has been deleted!`);
      },
      confirmText: 'Delete',
      isDangerous: true,
    });
  };

  const handleDeleteAllEvents = () => {
    setConfirmation({
      isOpen: true,
      title: 'Clear All Events',
      message: `This will remove ALL ${events.length} events from the calendar. This action cannot be undone.`,
      confirmAction: () => {
        console.log('🗑️ Deleting all events');

        if (!onClearAllEvents) {
          console.error('❌ onClearAllEvents callback not provided!');
          alert('❌ Error: Cannot clear events. Callback not configured.');
          setConfirmation({ ...confirmation, isOpen: false });
          return;
        }

        // ✅ CALL THE CALLBACK TO CLEAR ALL
        onClearAllEvents();
        console.log('✅ All events cleared');

        setUploadHistory([]);
        saveUploadHistory([]);

        alert('✅ All events have been deleted from the calendar.');
        setConfirmation({ ...confirmation, isOpen: false });
      },
      confirmText: 'Delete All',
      isDangerous: true,
    });
  };

  // ===============================
  // Smart File Upload Parser
  // ===============================
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    let text = '';

    // Only text files for now
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      text = await file.text();
    } else {
      alert('Please upload a .txt file\n\nExample: calendar.txt');
      return;
    }

    console.log('File content:', text);

    // Split into lines and remove empty ones
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const events: CalendarEvent[] = [];

    for (const line of lines) {
      // Try: 6 Dec 2025 Final Exam
      const match1 = line.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+(.+)$/);
      // Try: 06-12-2025 Final Exam or 06/12/2025 Final Exam
      const match2 = line.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(.+)$/);

      let day: number;
      let month: number;
      let year: number;
      let eventName: string;

      if (match1) {
        // DD MMM YYYY
        day = parseInt(match1[1], 10);
        const monthName = match1[2].toLowerCase().substring(0, 3);
        const months: { [key: string]: number } = {
          jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
          jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
        };
        month = months[monthName] ?? 0;
        year = parseInt(match1[3], 10);
        eventName = match1[4].trim();
      } else if (match2) {
        // DD-MM-YYYY or DD/MM/YYYY
        day = parseInt(match2[1], 10);
        month = parseInt(match2[2], 10);
        year = parseInt(match2[3], 10);
        eventName = match2[4].trim();
      } else {
        // This line does not match any known pattern
        console.log('Skipping line (no match):', line);
        continue;
      }

      if (month < 1 || month > 12 || day < 1 || day > 31 || !eventName) {
        console.log('Invalid date or empty title, skipping:', line);
        continue;
      }

      const isoDate = new Date(year, month - 1, day).toISOString().split('T')[0];
      const isExam = /exam|test|quiz|assessment|final|midterm/i.test(eventName);

      events.push({
        id: `event-${Date.now()}-${Math.random()}`,
        date: isoDate,
        title: eventName,
        time: '',
        type: isExam ? 'Exam' as const : 'Event' as const,
      });

      console.log('✅ Parsed:', { day, month, year, eventName, type: isExam ? 'Exam' : 'Event' });
    }

    if (events.length === 0) {
      alert('❌ No events found!\n\nFormat:\n6 Dec 2025 Final Exam\n10 Dec 2025 Quiz');
      return;
    }

    events.forEach(ev => {
      onAddEvent({
        date: ev.date,
        title: ev.title,
        time: ev.time,
        type: ev.type,
      });
    });

    alert(`✅ Successfully added ${events.length} events!`);
    console.log('✅ Events added:', events);
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error: ' + (error instanceof Error ? error.message : 'Unknown'));
  }

  event.target.value = '';
};

  // ===============================
  // Render Helper Functions
  // ===============================
  const getFileTypeIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄 PDF';
    if (fileType.includes('word') || fileType.includes('document')) return '📝 DOCX';
    if (fileType.startsWith('image')) return '🖼️ IMAGE';
    return '📦 FILE';
  };

  const stats = getUploadStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ===== MAIN CALENDAR CARD ===== */}
        <DashboardCard title="Academic Calendar" className="lg:col-span-2">
          {/* Calendar Header with Navigation */}
          <div className="flex justify-between items-center mb-4 -mt-4">
            <button
              onClick={handlePrevMonth}
              className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors text-gray-200"
            >
              &lt;
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-white text-center">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-4 py-2 bg-zinc-700 rounded-md hover:bg-zinc-600 transition-colors text-gray-200"
            >
              &gt;
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 text-center font-semibold text-gray-400 mb-2 text-xs sm:text-base">
            {daysOfWeek.map((day) => (
              <div key={day}>
                <span className="hidden md:inline">{day}</span>
                <span className="md:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
<div className="grid grid-cols-7 text-gray-200">
  {calendarGrid.map((cell) => {
    if (cell.isPadding || !cell.day)
      return (
        <div
          key={cell.key}
          className="border border-zinc-700 p-1 sm:p-2 bg-zinc-900/50"
        ></div>
      );

    const { day, isToday, events: dayEvents } = cell.day;

    return (
      <div
        key={cell.key}
        className={`border border-zinc-700 p-1 sm:p-2 h-20 sm:h-24 md:h-32 flex flex-col group relative ${
          currentRole === UserRole.Admin ? 'cursor-pointer hover:bg-zinc-700/50' : ''
        } transition-colors ${isToday ? 'bg-emerald-500/10' : ''}`}
        // ⬇️ Click on empty day area → add event
        onClick={() => currentRole === UserRole.Admin && handleDayClick(day)}
      >
        <div
          className={`text-sm sm:text-base font-semibold ${
            isToday ? 'text-emerald-300' : ''
          }`}
        >
          {day}
        </div>

        <div className="flex-grow overflow-y-auto mt-1 text-xs space-y-1 pr-1">
          {dayEvents.map((event) => (
            // ⬇️ Click on event itself → show details, NOT add-event modal
            <div
              key={event.id}
              className={`pl-1 pr-1 py-1 rounded group/event relative ${
                event.type === 'Exam'
                  ? 'bg-red-900/50 border-l-2 sm:border-l-4 border-red-500'
                  : 'bg-yellow-900/50 border-l-2 sm:border-l-4 border-yellow-500'
              }`}
              onClick={(e) => {
                e.stopPropagation(); // stop day click (add-event)
                alert(
                  `Title: ${event.title}\n` +
                  `Date: ${new Date(event.date).toLocaleDateString()}\n` +
                  (event.time ? `Time: ${event.time}\n` : '') +
                  `Type: ${event.type}`
                );
              }}
              onMouseEnter={() =>
                currentRole === UserRole.Admin && setSelectedEventForDelete(event.id)
              }
              onMouseLeave={() => setSelectedEventForDelete(null)}
            >
              <div className="flex items-start justify-between gap-1">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate text-gray-100 text-[10px] sm:text-xs">
                    {event.title}
                  </p>
                  {event.time && (
                    <p className="text-gray-400 text-[10px] sm:text-xs">
                      {event.time}
                    </p>
                  )}
                </div>

                {currentRole === UserRole.Admin &&
                  selectedEventForDelete === event.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // don’t trigger view or add
                        handleDeleteEvent(event.id);
                      }}
                      className="flex-shrink-0 text-red-300 hover:text-red-100 transition-colors text-xs font-bold"
                      title="Delete event"
                    >
                      ✕
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  })}
</div>

          {currentRole === UserRole.Admin && events.length > 0 && (
            <button
              onClick={() => handleDeleteAllEvents()}
              className="mt-4 w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-300 rounded-lg font-medium transition-colors text-sm"
            >
              🗑️ Clear All Events ({events.length})
            </button>
          )}
        </DashboardCard>

        {/* ===== SIDEBAR (RIGHT COLUMN) ===== */}
        <div className="space-y-6">
          {/* Current Time Card */}
          <DashboardCard title="Current Time">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{time.toLocaleTimeString()}</p>
              <p className="text-lg text-gray-400">
                {time.toLocaleDateString('default', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </DashboardCard>

       {/* Upload Section - Admin + Teacher */}
{(currentRole === UserRole.Admin || currentRole === UserRole.Teacher) && (
  <DashboardCard title="📤 Upload Academic Calendar">
    <div className="space-y-3">
      <input
        type="file"
        accept=".txt"
        onChange={handleFileUpload}
        className={`${formInputStyles} cursor-pointer`}
        disabled={uploading}
      />
      {uploading && (
        <div className="space-y-2">
          <div className="w-full bg-zinc-600 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-500 h-2 rounded-full w-3/4 animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-400 animate-pulse">{parseProgress}</p>
        </div>
      )}
      {uploadHistory.length > 0 && (
        <button
          onClick={() => setShowUploadHistory(!showUploadHistory)}
          className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium text-sm transition-colors"
        >
          📋 View Upload History ({uploadHistory.length})
        </button>
      )}
    </div>
  </DashboardCard>
)}

          {/* Instructions - Admin Only */}
          {currentRole === UserRole.Admin && (
            <DashboardCard title="📋 Instructions">
              <div className="text-sm text-gray-400 space-y-2">
                <p>✓ <strong>Upload:</strong> txt files only</p>
                <p>✓ <strong>Format:</strong> "6 Dec 2025 Exam Name"</p>
                <p>✓ <strong>Auto-Detect:</strong> Exam vs Event type</p>
                <p>✓ <strong>Visible to:</strong> Admin & Teachers</p>
                <p>✓ <strong>Manual Add:</strong> Click any day</p>
                <p>✓ <strong>Delete:</strong> Hover over events to delete</p>
              </div>
            </DashboardCard>
          )}

          {/* Recent Uploads - Teacher View */}
          {currentRole === UserRole.Teacher && uploadHistory.length > 0 && (
            <DashboardCard title="📊 Recent Uploads">
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {uploadHistory.slice(0, 3).map((upload) => (
                  <div key={upload.id} className="bg-zinc-700/30 p-3 rounded-lg border border-zinc-600">
                    <p className="text-sm font-semibold text-gray-200">{upload.fileName}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      📅 {new Date(upload.uploadedAt).toLocaleDateString()} • {upload.totalEventsAdded} events
                    </p>
                  </div>
                ))}
                {uploadHistory.length > 3 && (
                  <button
                    onClick={() => setShowTeacherUploads(!showTeacherUploads)}
                    className="w-full px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 rounded-lg text-emerald-300 font-medium text-sm transition-colors border border-emerald-600/30"
                  >
                    View All ({uploadHistory.length})
                  </button>
                )}
              </div>
            </DashboardCard>
          )}

          {/* Upcoming Events - Teacher View */}
          {currentRole === UserRole.Teacher && (
            <DashboardCard title="⏰ Upcoming Events (7 Days)">
              <UpcomingEventsSummary events={events} />
            </DashboardCard>
          )}
        </div>
      </div>

      {/* ===== CONFIRMATION MODAL ===== */}
      {confirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl w-full max-w-md border border-zinc-700">
            <h3 className="text-lg font-bold text-white mb-3">{confirmation.title}</h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">{confirmation.message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmation({ ...confirmation, isOpen: false })}
                className="px-5 py-2 bg-zinc-600 hover:bg-zinc-500 rounded-lg text-white font-medium transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmation.confirmAction();
                }}
                className={`px-5 py-2 rounded-lg text-white font-medium transition-colors text-sm ${
                  confirmation.isDangerous
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {confirmation.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== UPLOAD HISTORY MODAL ===== */}
      {showUploadHistory && uploadHistory.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl w-full max-w-2xl max-h-[70vh] overflow-y-auto border border-zinc-700">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-zinc-800/80">
              <h3 className="text-lg font-bold text-white">📋 Upload History</h3>
              <button
                onClick={() => setShowUploadHistory(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-4">
              {uploadHistory.map((upload, index) => (
                <div key={upload.id} className="bg-zinc-700/50 p-4 rounded-lg border border-zinc-600">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-white font-semibold">
                        #{index + 1} {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        Uploaded: {new Date(upload.uploadedAt).toLocaleString()} by {upload.uploadedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        +{upload.totalEventsAdded}
                      </span>
                      <button
                        onClick={() => handleDeleteUpload(upload.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-100 px-2 py-1 rounded text-xs font-semibold transition-colors border border-red-600/50"
                        title="Delete this upload"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {upload.eventsPreview.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-emerald-500 space-y-1">
                      {upload.eventsPreview.map((event, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded text-white font-semibold ${
                                event.type === 'Exam' ? 'bg-red-600' : 'bg-yellow-600'
                              }`}
                            >
                              {event.type}
                            </span>
                            <span className="text-gray-300 flex-1">{event.title}</span>
                            <span className="text-gray-500">{event.date}</span>
                          </div>
                        </div>
                      ))}
                      {upload.totalEventsAdded > 3 && (
                        <p className="text-xs text-gray-400 italic mt-2">
                          ... and {upload.totalEventsAdded - 3} more events
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {uploadHistory.length > 0 && (
              <button
                onClick={() => handleDeleteAllUploads()}
                className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-300 rounded-lg font-medium transition-colors text-sm"
              >
                🗑️ Delete All Upload History ({uploadHistory.length})
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===== TEACHER UPLOADS EXPANDED MODAL ===== */}
      {showTeacherUploads && uploadHistory.length > 0 && currentRole === UserRole.Teacher && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl w-full max-w-2xl max-h-[70vh] overflow-y-auto border border-zinc-700">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-zinc-800/80">
              <div>
                <h3 className="text-lg font-bold text-white">📊 Upload History</h3>
                <p className="text-xs text-gray-400">
                  Total: {stats.totalUploads} uploads • {stats.totalEventsAdded} events
                </p>
              </div>
              <button
                onClick={() => setShowTeacherUploads(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {uploadHistory.map((upload, index) => (
                <div key={upload.id} className="bg-zinc-700/50 p-4 rounded-lg border border-zinc-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-semibold">
                        #{index + 1} {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(upload.uploadedAt).toLocaleDateString()} • {getFileTypeIcon(upload.fileType)}
                      </p>
                    </div>
                    <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      +{upload.totalEventsAdded}
                    </span>
                  </div>

                  {upload.eventsPreview.length > 0 && (
                    <div className="mt-3 pl-3 border-l-2 border-emerald-500 space-y-1">
                      {upload.eventsPreview.map((event, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block px-2 py-1 rounded text-white font-semibold whitespace-nowrap ${
                                event.type === 'Exam' ? 'bg-red-600' : 'bg-yellow-600'
                              }`}
                            >
                              {event.type}
                            </span>
                            <span className="text-gray-300 flex-1 truncate">{event.title}</span>
                            <span className="text-gray-500 whitespace-nowrap">{event.date}</span>
                          </div>
                        </div>
                      ))}
                      {upload.totalEventsAdded > 3 && (
                        <p className="text-xs text-gray-400 italic mt-2">
                          ... and {upload.totalEventsAdded - 3} more events
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD EVENT MODAL (Admin Only) ===== */}
      {isModalOpen && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-zinc-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl w-full max-w-md border border-zinc-700">
            <h3 className="text-lg font-bold text-white mb-4">
              Add Event for {selectedDate.toLocaleDateString()}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className={formInputStyles}
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className={formInputStyles}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className={`${formInputStyles} appearance-none cursor-pointer`}
                >
                  <option value="Event">Event</option>
                  <option value="Exam">Exam</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-5 py-3 bg-zinc-600 hover:bg-zinc-500 rounded-3xl text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEvent}
                className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-medium transition-colors"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// Upcoming Events Component
// ============================================
interface UpcomingEventsSummaryProps {
  events: CalendarEvent[];
}

const UpcomingEventsSummary: React.FC<UpcomingEventsSummaryProps> = ({ events }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = events
    .filter((event) => {
      const eventDate = new Date(event.date);
      const daysAhead = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysAhead >= 0 && daysAhead <= 7;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-400">No upcoming events in the next 7 days</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {upcomingEvents.map((event) => {
        const eventDate = new Date(event.date);
        const daysAhead = Math.floor(
          (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <div key={event.id} className="bg-zinc-700/30 p-3 rounded-lg border border-zinc-600">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-white text-xs font-semibold whitespace-nowrap ${
                      event.type === 'Exam' ? 'bg-red-600/70' : 'bg-yellow-600/70'
                    }`}
                  >
                    {event.type}
                  </span>
                  <p className="text-white font-semibold text-sm truncate">{event.title}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  📅{' '}
                  {eventDate.toLocaleDateString('default', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                  {event.time && ` • ⏰ ${event.time}`}
                </p>
              </div>
              <div className="text-right ml-2">
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    daysAhead === 0 ? 'text-red-400 font-bold' : 'text-gray-400'
                  }`}
                >
                  {daysAhead === 0 ? '🔴 TODAY' : `in ${daysAhead}d`}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarPage;