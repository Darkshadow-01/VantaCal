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

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
}

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const today = new Date();

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="bg-gray-50 dark:bg-gray-800 p-3 text-center text-sm font-medium text-gray-600 dark:text-gray-400"
            >
              {day}
            </div>
          ))}

          {emptyDays.map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-gray-50 dark:bg-gray-800 min-h-[100px]"
            />
          ))}

          {days.map((day) => {
            const isToday = isSameDay(day, today);
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonthDay = isSameMonth(day, currentDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  bg-white dark:bg-gray-800 min-h-[100px] p-2 text-left transition-colors
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  ${!isCurrentMonthDay ? "opacity-50" : ""}
                  ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}
                  ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""}
                `}
              >
                <span
                  className={`
                    inline-flex items-center justify-center w-7 h-7 text-sm font-medium
                    ${isToday ? "bg-blue-500 text-white rounded-full" : ""}
                    ${!isCurrentMonthDay ? "text-gray-400" : "text-gray-900 dark:text-white"}
                  `}
                >
                  {format(day, "d")}
                </span>
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="p-4 border-t dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-800 dark:text-white mb-2">
              Events for {format(selectedDate, "MMMM d, yyyy")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No events scheduled for this day.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
