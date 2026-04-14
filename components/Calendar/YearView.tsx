"use client";

import { useMemo, useState } from "react";
import { format, startOfYear, endOfYear, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from "date-fns";
import type { CalendarEvent } from "@/lib/types";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";
import { cn } from "@/lib/utils";

interface YearlyViewProps {
  date: Date;
  events: CalendarEvent[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onEventMove?: (eventId: string, newStartTime: number, newEndTime: number) => void;
}

function MiniMonthView({ month, events, systemColors, onDateClick }: {
  month: Date;
  events: CalendarEvent[];
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    days.forEach((day) => map.set(format(day, "yyyy-MM-dd"), []));
    events.forEach((event) => {
      if (!event.startTime) return;
      const eventDate = new Date(event.startTime);
      if (isNaN(eventDate.getTime())) return;
      const key = format(eventDate, "yyyy-MM-dd");
      if (map.has(key)) map.get(key)!.push(event);
    });
    return map;
  }, [events, days]);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const viewMonth = month.getMonth();
  const viewYear = month.getFullYear();
  const isCurrentMonth = currentYear === viewYear && currentMonth === viewMonth;

  return (
    <div 
      className={cn(
        "bg-[var(--bg-primary)] rounded-xl border border-[var(--border)] overflow-hidden hover:shadow-lg hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer h-full",
        isCurrentMonth && "ring-2 ring-[var(--accent)]/50"
      )}
      onClick={() => onDateClick?.(month)}
    >
      <div className={cn(
        "py-2 px-3 text-center text-xs font-semibold border-b border-[var(--border)]",
        isCurrentMonth ? "bg-[var(--accent)]/10 text-[var(--accent)]" : "text-[var(--text-secondary)]"
      )}>
        {format(month, "MMM")}
      </div>
      <div className="grid grid-cols-7 gap-px p-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-[9px] text-center text-[var(--text-muted)] font-medium">{d}</div>
        ))}
        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="h-5" />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) || [];
          const isEventDay = dayEvents.length > 0;
          const isTodayDay = isToday(day);
          
          return (
            <div
              key={key}
              className={cn(
                "h-5 text-xs flex items-center justify-center transition-all duration-150",
                isTodayDay 
                  ? "bg-[var(--accent)] text-[var(--accent-contrast)] font-semibold rounded-full w-5 h-5 mx-auto" 
                  : isEventDay 
                    ? "text-[var(--accent)] font-medium" 
                    : "text-[var(--text-primary)]"
              )}
              onClick={(e) => { e.stopPropagation(); onDateClick?.(day); }}
            >
              {isEventDay && !isTodayDay ? (
                <div className="flex gap-px">
                  {dayEvents.slice(0, 2).map((event, idx) => (
                    <div 
                      key={idx} 
                      className={cn("w-1 h-1 rounded-full", systemColors[event.system as keyof typeof systemColors]?.bg || "bg-[var(--accent)]")}
                    />
                  ))}
                </div>
              ) : (
                format(day, "d")
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface YearViewProps extends YearlyViewProps {
  onYearChange?: (year: number) => void;
}

export function YearView({ date, events, systemColors, onDateClick, onYearChange }: YearViewProps) {
  const year = date.getFullYear();
  
  const months = useMemo(() => {
    const yearStart = startOfYear(date);
    const yearEnd = endOfYear(date);
    return eachMonthOfInterval({ start: yearStart, end: yearEnd });
  }, [date]);

  const handlePrevYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onYearChange) {
      onYearChange(year - 1);
    } else {
      onDateClick?.(new Date(year - 1, 0, 1));
    }
  };

  const handleNextYear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onYearChange) {
      onYearChange(year + 1);
    } else {
      onDateClick?.(new Date(year + 1, 0, 1));
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--bg-primary)] p-4">
      {/* Year header */}
      <div className="flex items-center justify-between mb-4 px-2 flex-shrink-0">
        <button 
          onClick={handlePrevYear}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all press-scale"
        >
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-2xl font-serif text-[var(--text-primary)]">{year}</h2>
        <button 
          onClick={handleNextYear}
          className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-all press-scale"
        >
          <svg className="w-5 h-5 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Months grid - 4 months per row, fills available space */}
      <div className="flex-1 grid grid-cols-4 grid-rows-3 gap-4 min-h-0">
        {months.map((month) => (
          <MiniMonthView
            key={month.toISOString()}
            month={month}
            events={events}
            systemColors={systemColors}
            onDateClick={onDateClick}
          />
        ))}
      </div>
    </div>
  );
}