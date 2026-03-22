"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { useAuth } from "@clerk/react";
import { Lock } from "lucide-react";

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function MiniCalendar() {
  const { userId } = useAuth();
  const { events, isDecrypting } = useEncryptedEvents(userId || undefined);
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!hasMasterKey()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4 flex items-center justify-center h-48">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unlock app to view events</p>
        </div>
      </div>
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const today = new Date();

  const getEventDates = () => {
    const dates = new Set<string>();
    events?.forEach((event) => {
      dates.add(format(new Date(event.startTime), "yyyy-MM-dd"));
    });
    return dates;
  };

  const eventDates = getEventDates();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {format(currentDate, "MMMM yyyy")}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {isDecrypting && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
          Decrypting events...
        </div>
      )}

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((day, i) => (
          <div
            key={i}
            className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const hasEvent = eventDates.has(format(day, "yyyy-MM-dd"));

          return (
            <div
              key={day.toISOString()}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg cursor-pointer
                transition-colors relative
                ${isToday ? "bg-blue-600 text-white font-semibold" : ""}
                ${!isCurrentMonth ? "text-gray-400" : "text-gray-700 dark:text-gray-300"}
                hover:bg-gray-100 dark:hover:bg-gray-700
              `}
            >
              {format(day, "d")}
              {hasEvent && !isToday && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
