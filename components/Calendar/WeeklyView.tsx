"use client";

import { useMemo } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameDay,
  isToday,
} from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { EventBlock } from "./EventBlock";
import type { EventData } from "@/lib/use-encrypted-events";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";

interface WeeklyViewProps {
  date: Date;
  events: EventData[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onSlotClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: EventData, e: React.MouseEvent) => void;
  selectedEvents?: EventData[];
  onEventSelect?: (event: EventData) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeeklyView({ date, events, buffers, systemColors, onSlotClick, onEventClick, selectedEvents = [], onEventSelect }: WeeklyViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventData[]>();
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, []);
    });

    events.forEach((event) => {
      const eventDate = new Date(event.startTime);
      const key = format(eventDate, "yyyy-MM-dd");
      if (map.has(key)) {
        map.get(key)!.push(event);
      }
    });

    return map;
  }, [events, weekDays]);

  const buffersByDay = useMemo(() => {
    const map = new Map<string, BufferBlock[]>();
    weekDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, []);
    });

    buffers.forEach((buffer) => {
      const bufferDate = new Date(buffer.startTime);
      const key = format(bufferDate, "yyyy-MM-dd");
      if (map.has(key)) {
        map.get(key)!.push(buffer);
      }
    });

    return map;
  }, [buffers, weekDays]);

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
    return {
      top: `${(startMinutes / 60) * 100}%`,
      height: `${(durationMinutes / 60) * 100}%`,
    };
  };

  const getBufferConfig = (purpose: string) => {
    const configs: Record<string, { bg: string; label: string }> = {
      transition: { bg: "bg-gray-200 dark:bg-gray-600", label: "Trans" },
      recovery: { bg: "bg-amber-200 dark:bg-amber-700", label: "Rec" },
      buffer: { bg: "bg-blue-200 dark:bg-blue-700", label: "Buf" },
      travel: { bg: "bg-purple-200 dark:bg-purple-700", label: "Travel" },
    };
    return configs[purpose] || configs.buffer;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        {/* Day Headers */}
        <div className="grid grid-cols-8 border-b dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="p-3 text-center text-sm font-medium text-gray-500 dark:text-gray-400 border-r dark:border-gray-700">
            Time
          </div>
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-3 text-center border-r dark:border-gray-700 last:border-r-0 ${
                isToday(day) ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {format(day, "EEE")}
              </div>
              <div
                className={`text-2xl font-bold ${
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
        <div className="max-h-[700px] overflow-y-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b dark:border-gray-700/50">
              <div className="p-2 text-xs text-gray-500 dark:text-gray-400 text-right pr-3 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </div>
              {weekDays.map((day) => {
                const dayEvents = getEventsForDayAndHour(day, hour);
                const key = format(day, "yyyy-MM-dd");
                const dayBuffers = buffersByDay.get(key) || [];
                const isCurrentHour = isToday(day) && new Date().getHours() === hour;

                return (
                  <div
                    key={`${day.toISOString()}-${hour}`}
                    className={`
                      relative min-h-[60px] border-r dark:border-gray-700/50 last:border-r-0
                      ${isToday(day) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}
                      ${isCurrentHour ? "bg-blue-100/50 dark:bg-blue-900/20" : ""}
                      hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer
                    `}
                    onClick={() => onSlotClick?.(day, hour)}
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
                          systemColors={systemColors[event.system]}
                          onClick={(e) => onEventClick?.(event, e)}
                          style={{ top, height }}
                          showBuffer={false}
                        />
                      );
                    })}

                    {/* Buffers (shown as thin strips) */}
                    {dayBuffers
                      .filter((b) => new Date(b.startTime).getHours() === hour)
                      .map((buffer) => {
                        const config = getBufferConfig(buffer.purpose);
                        return (
                          <div
                            key={buffer.id}
                            className={`absolute left-1 right-1 ${config.bg} rounded border border-dashed border-gray-400 dark:border-gray-500 opacity-70`}
                            title={`${buffer.duration}m ${buffer.purpose}${buffer.recommended ? " (rec)" : ""}`}
                          >
                            <div className="px-1 text-[10px] text-gray-700 dark:text-gray-200 truncate flex items-center gap-0.5">
                              {buffer.recommended && <AlertTriangle className="w-2 h-2" />}
                              {buffer.duration}m
                            </div>
                          </div>
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
  );
}
