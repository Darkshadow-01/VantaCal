"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Lock, Loader2 } from "lucide-react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import type { EventData } from "@/lib/use-encrypted-events";
import { useAuth } from "@clerk/react";
import { EventBlock } from "./EventBlock";
import { EventModal } from "./EventModal";
import type { Id } from "@/convex/_generated/dataModel";

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
    text: "text-green-700 dark:text-green-300",
    hover: "hover:bg-green-50 dark:hover:bg-green-900/30",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
    text: "text-blue-700 dark:text-blue-300",
    hover: "hover:bg-blue-50 dark:hover:bg-blue-900/30",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
    text: "text-purple-700 dark:text-purple-300",
    hover: "hover:bg-purple-50 dark:hover:bg-purple-900/30",
  },
};

interface WeeklyCalendarProps {
  className?: string;
}

export function WeeklyCalendar({ className = "" }: WeeklyCalendarProps) {
  const { userId } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventData | null>(null);
  const [showModal, setShowModal] = useState(false);

  const { events, isDecrypting, createEvent, updateEvent, deleteEvent } = useEncryptedEvents(userId);
  const isLocked = !hasMasterKey();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventData[]>();
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, []);
    });
    
    events?.forEach((event) => {
      const eventDate = new Date(event.startTime);
      const key = format(eventDate, "yyyy-MM-dd");
      if (map.has(key)) {
        map.get(key)!.push(event);
      }
    });
    
    return map;
  }, [events, weekDays]);

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleSlotClick = (date: Date, hour: number) => {
    const slotDate = setMinutes(setHours(date, hour), 0);
    setSelectedSlot({ date: slotDate, hour });
    setEditingEvent(null);
    setShowModal(true);
  };

  const handleEventClick = (event: EventData, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEvent(event);
    setSelectedSlot(null);
    setShowModal(true);
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    allDay: boolean;
    system: "Health" | "Work" | "Relationships";
    color?: string;
    recurrence?: string;
    location?: string;
  }) => {
    if (!userId) return;

    const data = {
      ...eventData,
      userId,
      color: SYSTEM_COLORS[eventData.system].bg,
    };

    if (editingEvent?._id) {
      await updateEvent(editingEvent._id, data);
    } else {
      await createEvent(data);
    }
    setShowModal(false);
    setEditingEvent(null);
    setSelectedSlot(null);
  };

  const handleDeleteEvent = async (eventId: Id<"events">) => {
    await deleteEvent(eventId);
    setShowModal(false);
    setEditingEvent(null);
  };

  const getEventsForDayAndHour = (day: Date, hour: number): EventData[] => {
    const key = format(day, "yyyy-MM-dd");
    const dayEvents = eventsByDay.get(key) || [];
    return dayEvents.filter((event) => {
      const eventStart = new Date(event.startTime);
      return eventStart.getHours() === hour;
    });
  };

  const getEventPosition = (event: EventData) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMinutes = start.getMinutes();
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return { top: `${(startMinutes / 60) * 100}%`, height: `${(durationMinutes / 60) * 100}%` };
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </h2>
          <div className="flex gap-1">
            <button
              onClick={handlePrevWeek}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNextWeek}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
        
        {/* System Legend */}
        <div className="hidden sm:flex items-center gap-4">
          {Object.entries(SYSTEM_COLORS).map(([system, colors]) => (
            <div key={system} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors.bg}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">{system}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 border-b dark:border-gray-700">
            <div className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r dark:border-gray-700">
              Time
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={`p-2 text-center border-r dark:border-gray-700 last:border-r-0 ${
                  isToday(day) ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  {format(day, "EEE")}
                </div>
                <div
                  className={`text-lg font-semibold ${
                    isToday(day)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  {format(day, "d")}
                </div>
              </div>
            ))}
          </div>

          {/* Time Slots */}
          <div className="max-h-[600px] overflow-y-auto">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700/50">
                <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right pr-3 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                  {format(setHours(new Date(), hour), "h a")}
                </div>
                {weekDays.map((day) => {
                  const dayEvents = getEventsForDayAndHour(day, hour);
                  const isCurrentHour = isToday(day) && new Date().getHours() === hour;

                  return (
                    <div
                      key={`${day.toISOString()}-${hour}`}
                      className={`
                        relative min-h-[60px] border-r dark:border-gray-700/50 last:border-r-0
                        ${isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
                        ${isCurrentHour ? "bg-blue-100/50 dark:bg-blue-900/20" : ""}
                        hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors
                      `}
                      onClick={() => handleSlotClick(day, hour)}
                    >
                      {/* Current time indicator */}
                      {isCurrentHour && (
                        <div className="absolute left-0 right-0 top-0 h-0.5 bg-red-500 z-10" />
                      )}

                      {/* Events */}
                      {dayEvents.map((event) => {
                        const { top, height } = getEventPosition(event);
                        return (
                          <EventBlock
                            key={event._id}
                            event={event}
                            systemColors={SYSTEM_COLORS[event.system]}
                            onClick={(e) => handleEventClick(event, e)}
                            style={{ top, height }}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={editingEvent}
          selectedSlot={selectedSlot}
          systemColors={SYSTEM_COLORS}
          onSave={handleSaveEvent}
          onDelete={editingEvent?._id ? () => handleDeleteEvent(editingEvent._id as Id<"events">) : undefined}
          onClose={() => {
            setShowModal(false);
            setEditingEvent(null);
            setSelectedSlot(null);
          }}
        />
      )}

      {/* Locked State Overlay */}
      {isLocked && (
        <div className="absolute inset-0 bg-gray-900/50 dark:bg-gray-900/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 max-w-sm text-center">
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              App Locked
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Please unlock the app to view and manage your calendar events.
            </p>
          </div>
        </div>
      )}

      {/* Decrypting Overlay */}
      {isDecrypting && (
        <div className="absolute inset-0 bg-gray-900/30 dark:bg-gray-900/50 flex items-center justify-center z-40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-700 dark:text-gray-300">Decrypting events...</span>
          </div>
        </div>
      )}
    </div>
  );
}
