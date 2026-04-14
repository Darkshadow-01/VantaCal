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
  isToday,
} from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
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

function getSystemColorClass(system?: string) {
  switch (system) {
    case "Health":
      return {
        bg: "bg-[#16A34A]",
        bgLight: "bg-[#DCFCE7] dark:bg-[#16A34A]/20",
        text: "text-[#16A34A] dark:text-[#4ADE80]",
      };
    case "Work":
      return {
        bg: "bg-[#2563EB]",
        bgLight: "bg-[#DBEAFE] dark:bg-[#2563EB]/20",
        text: "text-[#2563EB] dark:text-[#60A5FA]",
      };
    case "Relationships":
      return {
        bg: "bg-[#9333EA]",
        bgLight: "bg-[#F3E8FF] dark:bg-[#9333EA]/20",
        text: "text-[#9333EA] dark:text-[#C084FC]",
      };
    default:
      return {
        bg: "bg-[#57534E]",
        bgLight: "bg-[#F5F5F4] dark:bg-[#57534E]/20",
        text: "text-[#57534E] dark:text-[#A8A29E]",
      };
  }
}

function DraggableEventDot({ event, onClick }: {
  event: CalendarEvent;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: event.id,
    data: event,
  });

  const colors = getSystemColorClass(event.system);

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
      className={cn("w-2 h-2 rounded-full cursor-grab", colors.bg)}
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

  const dayOfWeek = day.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col p-0.5 transition-all cursor-pointer border-r border-b border-[var(--border)]",
        !isCurrentMonthDay && "opacity-40 bg-[var(--bg-secondary)]/30",
        isCurrentMonthDay && isOver && "bg-[var(--bg-secondary)]",
        isCurrentMonthDay && !isOver && "hover:bg-[var(--bg-secondary)]/50",
        isWeekend && isCurrentMonthDay && "bg-[var(--bg-secondary)]/20"
      )}
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
      transition: { bg: "bg-[#F5F5F4]", color: "text-[#57534E]" },
      recovery: { bg: "bg-[#FEF3C7]", color: "text-[#B45309]" },
      buffer: { bg: "bg-[#DBEAFE]", color: "text-[#1D4ED8]" },
      travel: { bg: "bg-[#F3E8FF]", color: "text-[#7E22CE]" },
    };
    return configs[purpose] || configs.buffer;
  }, []);

  return (
    <div
      className={cn(
        "flex flex-col flex-1 p-1 transition-all cursor-pointer",
        !isCurrentMonthDay && "opacity-40",
        isCurrentDay && "bg-[var(--bg-secondary)]/50",
        "hover:bg-[var(--bg-secondary)] hover:scale-[1.01]"
      )}
      onClick={() => isCurrentMonthDay && onDateClick?.(day)}
    >
      {/* Day number */}
      <div className="flex justify-center shrink-0 mb-0.5">
        <span
          className={cn(
            "inline-flex items-center justify-center w-6 h-6 text-xs font-medium transition-all duration-200 font-sans",
            isCurrentDay 
              ? "bg-[var(--accent)] text-[var(--accent-contrast)] shadow-lg shadow-black/10 animate-glow" 
              : isCurrentMonthDay 
                ? "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-full"
                : "text-[var(--text-muted)]"
          )}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Events as minimal pills */}
      <div className="flex-1 flex flex-col gap-px overflow-hidden px-0.5">
        {dayEvents.slice(0, 3).map((event) => {
          const colors = getSystemColorClass(event.system);
          return (
            <button
              key={event.id}
              onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e); }}
              className={cn(
                "w-full text-[9px] px-1.5 py-0.5 rounded truncate text-left transition-all duration-150 hover:scale-[1.02] font-sans",
                colors.bgLight,
                colors.text,
                "border-l-2",
                colors.bg.replace("bg-[", "border-[").replace("]", "")
              )}
            >
              {event.title}
            </button>
          );
        })}
        {dayEvents.length > 3 && (
          <span className="text-[8px] text-[var(--text-muted)] text-center font-sans">+{dayEvents.length - 3}</span>
        )}
        {dayEvents.length === 0 && <div className="flex-1" />}
      </div>

      {/* Buffers */}
      {dayBuffers.length > 0 && (
        <div className="flex gap-0.5 shrink-0">
          {dayBuffers.slice(0, 1).map((buffer) => {
            const config = getBufferConfig(buffer.purpose);
            return (
              <div key={buffer.id} className={cn("text-[9px] px-1 rounded font-sans", config.bg, config.color)}>
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

  const viewStart = startOfDay(startOfMonth(date));
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

  const getSystemColorClassForDrag = (system?: string) => {
    const colors = getSystemColorClass(system);
    return colors.bg;
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col bg-[var(--bg-primary)]">
        {/* Weekday headers - refined typography */}
        <div className="grid grid-cols-7 border-b border-[var(--border)] shrink-0">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-center text-xs font-medium text-[var(--text-muted)] font-sans">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="bg-[var(--bg-secondary)]/30 border-r border-b border-[var(--border)]" />
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
          <div className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg font-sans",
            getSystemColorClassForDrag(activeEvent.system)
          )}>
            {activeEvent.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}