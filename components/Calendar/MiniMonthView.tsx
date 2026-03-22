"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";

interface MiniMonthViewProps {
  selectedDate: Date;
  events: EventData[];
  onDateSelect: (date: Date) => void;
}

export function MiniMonthView({ selectedDate, events, onDateSelect }: MiniMonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const eventsByDay = new Map<string, EventData[]>();
  events.forEach((event) => {
    const key = format(new Date(event.startTime), "yyyy-MM-dd");
    if (!eventsByDay.has(key)) {
      eventsByDay.set(key, []);
    }
    eventsByDay.get(key)!.push(event);
  });

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b dark:border-gray-700">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {format(currentMonth, "MMMM yyyy")}
        </span>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b dark:border-gray-700">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <div
            key={idx}
            className="p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {emptyDays.map((_, idx) => (
          <div key={`empty-${idx}`} className="p-1" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={`
                p-1 aspect-square flex flex-col items-center justify-center relative
                transition-colors hover:bg-gray-50 dark:hover:bg-gray-700
                ${!isCurrentMonth ? "opacity-30" : ""}
                ${isSelected ? "bg-blue-100 dark:bg-blue-900/30" : ""}
              `}
            >
              <span
                className={`
                  text-sm font-medium
                  ${isToday(day) ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}
                  ${isSelected ? "font-bold" : ""}
                `}
              >
                {format(day, "d")}
              </span>
              
              {/* Event Indicators */}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        event.system === "Health"
                          ? "bg-green-500"
                          : event.system === "Work"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                      }`}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] text-gray-500">+</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WeekNumbers({ date }: { date: Date }) {
  const weeks = [];
  const year = date.getFullYear();
  const month = date.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let currentWeek = getWeekNumber(firstDay);
  const lastWeekNumber = getWeekNumber(lastDay);
  
  while (currentWeek <= lastWeekNumber) {
    weeks.push(currentWeek);
    currentWeek++;
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
        Week #
      </div>
      {weeks.map((week) => (
        <div
          key={week}
          className="text-xs text-gray-500 dark:text-gray-400 text-center py-0.5"
        >
          {week}
        </div>
      ))}
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
