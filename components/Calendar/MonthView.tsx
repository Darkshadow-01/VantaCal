"use client";

import { useMemo, useCallback, memo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfDay,
  startOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addDays,
} from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
import { Clock } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";
import { cn } from "@/lib/utils";

interface MonthlyViewProps {
  date: Date;
  events: CalendarEvent[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onEventMove?: (eventId: string, newStartTime: number, newEndTime: number) => void;
  selectedEvents?: CalendarEvent[];
  onEventSelect?: (event: CalendarEvent) => void;
}

function DraggableEventDot({ event, systemColors, onClick }: {
  event: CalendarEvent;
  systemColors: Record<string, any>;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`w-2 h-2 rounded-full cursor-grab ${systemColors[event.system as keyof typeof systemColors]?.bg || "bg-gray-500"}`}
      title={event.title}
      onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
    />
  );
}

function DroppableDay({ day, isCurrentMonthDay, onClick, children }: {
  day: Date;
  isCurrentMonthDay: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: format(day, "yyyy-MM-dd"),
    data: day,
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        bg-white dark:bg-[#1A1D24] flex flex-col p-0.5 transition-colors cursor-pointer border-r border-b border-gray-100 dark:border-[#333]
        ${!isCurrentMonthDay ? "bg-gray-50/50 dark:bg-[#252830]/50" : ""}
        ${isOver && isCurrentMonthDay ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}
        hover:bg-gray-50 dark:hover:bg-[#252830]/50
      `}
      onClick={() => isCurrentMonthDay && onClick?.()}
    >
      {children}
    </div>
  );
}

const DayCell = memo(function DayCell({
  day,
  dayEvents,
  dayBuffers,
  isCurrentDay,
  isCurrentMonthDay,
  systemColors,
  onDateClick,
  onEventClick,
}: {
  day: Date;
  dayEvents: CalendarEvent[];
  dayBuffers: BufferBlock[];
  isCurrentDay: boolean;
  isCurrentMonthDay: boolean;
  systemColors: Record<string, any>;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
}) {
  const getBufferConfig = useCallback((purpose: string) => {
    const configs: Record<string, { bg: string; color: string }> = {
      transition: { bg: "bg-gray-100 dark:bg-gray-700", color: "text-gray-600 dark:text-gray-300" },
      recovery: { bg: "bg-amber-100 dark:bg-amber-900/30", color: "text-amber-600 dark:text-amber-300" },
      buffer: { bg: "bg-blue-100 dark:bg-blue-900/30", color: "text-blue-600 dark:text-blue-300" },
      travel: { bg: "bg-purple-100 dark:bg-purple-900/30", color: "text-purple-600 dark:text-purple-300" },
    };
    return configs[purpose] || configs.buffer;
  }, []);

  return (
    <div
      className={`
        flex flex-col flex-1 p-1 transition-colors cursor-pointer
        ${!isCurrentMonthDay ? "opacity-40" : ""}
        ${isCurrentDay ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}
        hover:bg-gray-50 dark:hover:bg-[#252830]/50
      `}
      onClick={() => isCurrentMonthDay && onDateClick?.(day)}
    >
      {/* Day number */}
      <div className="flex justify-center shrink-0 mb-0.5">
        <span
          className={`
            inline-flex items-center justify-center w-5 h-5 text-xs font-medium transition-all duration-200
            ${isCurrentDay 
              ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30" 
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#252830] rounded-full"
            }
            ${!isCurrentMonthDay ? "text-gray-400 dark:text-gray-500" : ""}
          `}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Events as small bars - fills remaining space */}
      <div className="flex-1 flex flex-col gap-px overflow-hidden px-0.5">
        {dayEvents.slice(0, 4).map((event) => {
          const colors = systemColors[event.system as keyof typeof systemColors] || { bg: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-500", text: "text-blue-700", hover: "hover:bg-blue-50" };
          return (
            <button
              key={event.id}
              onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e); }}
              className={cn(
                "w-full text-[9px] px-1 py-0.5 rounded-sm truncate text-left transition-all duration-150 hover:scale-[1.02]",
                colors.bgLight,
                colors.text,
                "border-l-2"
              )}
              style={{ borderLeftColor: colors.bg.replace("bg-", "") }}
            >
              {event.title}
            </button>
          );
        })}
        {dayEvents.length > 4 && (
          <span className="text-[8px] text-gray-500 dark:text-gray-400 text-center">+{dayEvents.length - 4}</span>
        )}
        {dayEvents.length === 0 && <div className="flex-1" />}
      </div>

      {/* Buffers */}
      {dayBuffers.length > 0 && (
        <div className="flex gap-0.5 shrink-0">
          {dayBuffers.slice(0, 1).map((buffer) => {
            const config = getBufferConfig(buffer.purpose);
            return (
              <div key={buffer.id} className={`text-[9px] px-1 rounded ${config.bg} ${config.color}`}>
                {buffer.duration}m
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  if (prev.day.getTime() !== next.day.getTime()) return false;
  const prevEventIds = prev.dayEvents.map(e => e.id).join(",");
  const nextEventIds = next.dayEvents.map(e => e.id).join(",");
  if (prevEventIds !== nextEventIds) return false;
  const prevBufferIds = prev.dayBuffers.map(b => b.id).join(",");
  const nextBufferIds = next.dayBuffers.map(b => b.id).join(",");
  if (prevBufferIds !== nextBufferIds) return false;
  return prev.isCurrentDay === next.isCurrentDay && prev.isCurrentMonthDay === next.isCurrentMonthDay;
});

export function MonthView({ date, events, buffers, systemColors, onDateClick, onEventClick, onEventMove, selectedEvents = [], onEventSelect }: MonthlyViewProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const days = useMemo(() => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [date]);

  const viewStart = startOfDay(startOfWeek(date));
  const startDayOfWeek = viewStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const viewStartDate = startOfDay(monthStart);
    const viewEndDate = startOfDay(monthEnd);
    viewEndDate.setDate(viewEndDate.getDate() + 1);
    
    const startDayOfWeekVal = viewStartDate.getDay();
    const endDayOfWeekVal = 6 - viewEndDate.getDay();
    
    const allDays: Date[] = [];
    for (let i = startDayOfWeekVal - 1; i >= 0; i--) {
      const d = new Date(viewStartDate);
      d.setDate(d.getDate() - i);
      allDays.push(d);
    }
    allDays.push(...days);
    for (let i = 1; i <= endDayOfWeekVal; i++) {
      const d = new Date(viewEndDate);
      d.setDate(d.getDate() - 1 + i);
      allDays.push(d);
    }
    
    allDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, []);
    });

    events.forEach((event) => {
      if (!event.startTime) return;
      const eventDate = new Date(event.startTime);
      if (isNaN(eventDate.getTime())) return;
      const key = format(eventDate, "yyyy-MM-dd");
      if (map.has(key)) {
        map.get(key)!.push(event);
      }
    });

    return map;
  }, [events, days, date]);

  const buffersByDay = useMemo(() => {
    const map = new Map<string, BufferBlock[]>();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const viewStartDate = startOfDay(monthStart);
    const viewEndDate = startOfDay(monthEnd);
    viewEndDate.setDate(viewEndDate.getDate() + 1);
    const startDayOfWeekVal = viewStartDate.getDay();
    const endDayOfWeekVal = 6 - viewEndDate.getDay();
    const allDays: Date[] = [];
    for (let i = startDayOfWeekVal - 1; i >= 0; i--) {
      const d = new Date(viewStartDate);
      d.setDate(d.getDate() - i);
      allDays.push(d);
    }
    allDays.push(...days);
    for (let i = 1; i <= endDayOfWeekVal; i++) {
      const d = new Date(viewEndDate);
      d.setDate(d.getDate() - 1 + i);
      allDays.push(d);
    }
    allDays.forEach((day) => {
      const key = format(day, "yyyy-MM-dd");
      map.set(key, []);
    });
    buffers.forEach((buffer) => {
      if (!buffer.startTime) return;
      const bufferDate = new Date(buffer.startTime);
      if (isNaN(bufferDate.getTime())) return;
      const key = format(bufferDate, "yyyy-MM-dd");
      if (map.has(key)) {
        map.get(key)!.push(buffer);
      }
    });
    return map;
  }, [buffers, days, date]);

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current as CalendarEvent;
    setActiveEvent(eventData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);
    
    if (!over || !onEventMove) return;
    
    const eventData = active.data.current as CalendarEvent;
    const targetDate = over.data.current as Date;
    
    if (!eventData?.startTime || !targetDate) return;
    
    const originalDate = new Date(eventData.startTime);
    const duration = eventData.endTime && eventData.startTime 
      ? eventData.endTime - eventData.startTime 
      : 3600000;
    
    const newStartTime = new Date(targetDate);
    newStartTime.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    onEventMove(eventData.id, newStartTime.getTime(), newEndTime.getTime());
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-white dark:bg-[#1A1D24]">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-[#333] shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid - fills remaining space */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="bg-gray-50/50 dark:bg-[#252830]/50 border-r border-b border-gray-100 dark:border-[#333]" />
          ))}

          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(key) || [];
            const dayBuffers = buffersByDay.get(key) || [];
            const isCurrentDay = isToday(day);
            const isCurrentMonthDay = isSameMonth(day, date);

            return (
              <DroppableDay
                key={day.toISOString()}
                day={day}
                isCurrentMonthDay={isCurrentMonthDay}
                onClick={() => onDateClick?.(day)}
              >
                <DayCell
                  day={day}
                  dayEvents={dayEvents}
                  dayBuffers={dayBuffers}
                  isCurrentDay={isCurrentDay}
                  isCurrentMonthDay={isCurrentMonthDay}
                  systemColors={systemColors}
                  onDateClick={onDateClick}
                  onEventClick={onEventClick}
                />
              </DroppableDay>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeEvent && (
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg ${systemColors[activeEvent.system as keyof typeof systemColors]?.bg || "bg-gray-500"}`}>
            {activeEvent.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}