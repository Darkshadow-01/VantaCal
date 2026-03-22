"use client";

import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Clock, AlertTriangle, Info } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";

interface MonthlyViewProps {
  date: Date;
  events: EventData[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: EventData, e: React.MouseEvent) => void;
  selectedEvents?: EventData[];
  onEventSelect?: (event: EventData) => void;
}

export function MonthlyView({ date, events, buffers, systemColors, onDateClick, onEventClick, selectedEvents = [], onEventSelect }: MonthlyViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventData[]>();
    days.forEach((day) => {
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
  }, [events, days]);

  const buffersByDay = useMemo(() => {
    const map = new Map<string, BufferBlock[]>();
    days.forEach((day) => {
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
  }, [buffers, days]);

  const getBufferConfig = (purpose: string) => {
    const configs: Record<string, { bg: string; color: string }> = {
      transition: { bg: "bg-gray-100 dark:bg-gray-700", color: "text-gray-600 dark:text-gray-300" },
      recovery: { bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-300" },
      buffer: { bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-300" },
      travel: { bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-300" },
    };
    return configs[purpose] || configs.buffer;
  };

  return (
    <div className="p-4">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-t-lg overflow-hidden">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
        {/* Empty days from previous month */}
        {emptyDays.map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-50 dark:bg-gray-800 min-h-[120px]"
          />
        ))}

        {/* Days of current month */}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const dayBuffers = buffersByDay.get(key) || [];
          const isCurrentDay = isToday(day);
          const isCurrentMonthDay = isSameMonth(day, date);

          return (
            <div
              key={day.toISOString()}
              className={`
                bg-white dark:bg-gray-800 min-h-[120px] p-2 transition-colors cursor-pointer
                ${!isCurrentMonthDay ? "opacity-50" : ""}
                ${isCurrentDay ? "ring-2 ring-blue-500 ring-inset" : ""}
                hover:bg-gray-50 dark:hover:bg-gray-700/50
              `}
              onClick={() => isCurrentMonthDay && onDateClick?.(day)}
            >
              {/* Date Number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm font-medium
                    ${isCurrentDay ? "bg-blue-500 text-white rounded-full" : ""}
                    ${!isCurrentMonthDay ? "text-gray-400" : "text-gray-900 dark:text-white"}
                  `}
                >
                  {format(day, "d")}
                </span>

                {/* Event count badge */}
                {dayEvents.length > 0 && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {dayEvents.length} event{dayEvents.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Event Dots */}
              {dayEvents.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event._id}
                      className={`w-2 h-2 rounded-full ${systemColors[event.system]?.bg || "bg-gray-500"} cursor-pointer hover:scale-125 transition-transform`}
                      title={event.title}
                      onClick={(e) => onEventClick?.(event, e)}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      +{dayEvents.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Buffer indicator */}
              {dayBuffers.length > 0 && (
                <div className="flex items-center gap-1 mb-1">
                  {dayBuffers.slice(0, 2).map((buffer) => {
                    const config = getBufferConfig(buffer.purpose);
                    return (
                      <div
                        key={buffer.id}
                        className={`flex items-center gap-0.5 ${config.bg} rounded px-1 py-0.5 text-[10px] ${config.color}`}
                        title={`${buffer.duration}m ${buffer.purpose}${buffer.recommended ? " (recommended)" : ""}`}
                      >
                        <Clock className="w-2 h-2" />
                        <span>{buffer.duration}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Event Titles (if few events) */}
              {dayEvents.length > 0 && dayEvents.length <= 2 && (
                <div className="space-y-1">
                  {dayEvents.map((event) => (
                    <div
                      key={event._id}
                      className={`
                        text-xs px-2 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity
                        ${systemColors[event.system]?.bg || "bg-gray-500"} text-white shadow-sm
                      `}
                      title={`${event.title} (${format(new Date(event.startTime), "h:mm a")})`}
                      onClick={(e) => onEventClick?.(event, e)}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Insights Panel */}
      <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-purple-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
              AI Insights for {format(date, "MMMM yyyy")}
            </h4>
            <div className="space-y-1 text-sm text-purple-600 dark:text-purple-400">
              <p>
                {events.length} events scheduled this month
              </p>
              <p>
                {buffers.filter((b) => isSameMonth(new Date(b.startTime), date)).reduce((sum, b) => sum + b.duration, 0)} minutes
                of buffer time recommended
              </p>
              {buffers.filter((b) => b.recommended && isSameMonth(new Date(b.startTime), date)).length > 0 && (
                <p className="flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  {buffers.filter((b) => b.recommended && isSameMonth(new Date(b.startTime), date)).length} high-priority
                  buffers suggested by AI
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Breakdown */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {["Health", "Work", "Relationships"].map((system) => {
          const systemEvents = events.filter((e) => e.system === system);
          const totalHours = systemEvents.reduce((sum, e) => {
            const start = new Date(e.startTime);
            const end = new Date(e.endTime);
            return sum + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          }, 0);

          return (
            <div
              key={system}
              className={`${systemColors[system]?.bgLight || "bg-gray-50"} rounded-lg p-4 border ${systemColors[system]?.border || "border-gray-200"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-4 h-4 rounded-full ${systemColors[system]?.bg || "bg-gray-500"}`} />
                <h5 className={`font-medium ${systemColors[system]?.text || "text-gray-700"}`}>
                  {system}
                </h5>
              </div>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>{systemEvents.length} events</p>
                <p>{totalHours.toFixed(1)} hours</p>
                <p className="text-xs text-gray-500">
                  {events.length > 0 ? Math.round((systemEvents.length / events.length) * 100) : 0}% of total
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
