"use client";

import { useMemo, useState, useCallback } from "react";
import { format, isSameDay, setHours, setMinutes, addDays, startOfDay } from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
import { Clock } from "lucide-react";
import { EventBlock } from "./EventBlock";
import type { CalendarEvent } from "@/lib/types";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";
import { expandRecurringEvents, type EventWithRecurrence } from "@/src/features/calendar";
import { cn } from "@/lib/utils";

interface DailyViewProps {
  date: Date;
  events: CalendarEvent[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onSlotClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
  onEventMove?: (eventId: string, newStartTime: number, newEndTime: number) => void;
  selectedEvents?: CalendarEvent[];
  onEventSelect?: (event: CalendarEvent) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function calculateEventColumns(events: CalendarEvent[]): Map<string, { column: number; totalColumns: number }> {
  const result = new Map<string, { column: number; totalColumns: number }>();
  
  if (events.length === 0) return result;
  
  const sortedEvents = [...events]
    .filter(e => e.startTime && e.endTime)
    .sort((a, b) => a.startTime! - b.startTime!);
  
  const placed: CalendarEvent[] = [];
  
  for (const event of sortedEvents) {
    const eventKey = event.id;
    const startTime = event.startTime!;
    const endTime = event.endTime!;
    
    let column = 0;
    for (let i = 0; i < placed.length; i++) {
      const placedEvent = placed[i];
      const placedStart = placedEvent.startTime!;
      const placedEnd = placedEvent.endTime!;
      
      if (startTime >= placedEnd || endTime <= placedStart) {
        column = i;
        break;
      }
      column = i + 1;
    }
    
    placed.splice(column, 0, event);
    result.set(eventKey, { column, totalColumns: placed.length });
  }
  
  return result;
}

function DraggableEvent({ event, systemColors, onClick }: { 
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

  if (!event.startTime) return null;
  
  const startDate = new Date(event.startTime);
  const top = startDate.getHours() * 60 + startDate.getMinutes();
  const duration = event.endTime && event.startTime 
    ? (event.endTime - event.startTime) / (1000 * 60) 
    : 60;
  const height = Math.max(duration, 20);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, position: "absolute", top: `${top}px`, left: 4, right: 4 }}
      {...listeners}
      {...attributes}
    >
      <EventBlock 
        event={event} 
                systemColors={systemColors[event.system as keyof typeof systemColors] || { bg: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-500/60", border: "border-blue-500", text: "text-blue-700 dark:text-blue-400", hover: "hover:bg-blue-50 dark:hover:bg-blue-500/70" }}
        onClick={handleClick}
        style={{ top: "0px", height: `${height}px` }}
      />
    </div>
  );
}

function DroppableHour({ hour, onClick, children }: {
  hour: number;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `hour-${hour}`,
    data: { hour },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`h-[60px] relative border-b border-r border-[var(--border)] cursor-pointer transition-colors ${
        isOver ? "bg-[var(--bg-secondary)]" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
    >
      {children}
    </div>
  );
}

export function DayView({ 
  date, 
  events, 
  buffers, 
  systemColors, 
  onSlotClick, 
  onEventClick,
  onEventMove,
  selectedEvents = [], 
  onEventSelect 
}: DailyViewProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  const dayEvents = useMemo(() => {
    return expandRecurringEvents(events as unknown as EventWithRecurrence[], date, "daily") as unknown as CalendarEvent[];
  }, [events, date]);

  const dayBuffers = useMemo(() => {
    return buffers.filter((buffer) => {
      return isSameDay(new Date(buffer.startTime), date);
    });
  }, [buffers, date]);

  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();

  const hourLabels = useMemo(() => 
    HOURS.map((hour) => format(setHours(new Date(), hour), "h a")), 
  []);

  const handleHourClick = useCallback((hour: number) => {
    onSlotClick?.(date, hour);
  }, [date, onSlotClick]);

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current as CalendarEvent;
    setActiveEvent(eventData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);
    
    if (!over || !onEventMove) return;
    
    const eventData = active.data.current as CalendarEvent;
    const dropData = over.data.current as { hour: number };
    
    if (!eventData?.startTime || dropData === undefined) return;
    
    const originalDate = new Date(eventData.startTime);
    const duration = eventData.endTime && eventData.startTime 
      ? eventData.endTime - eventData.startTime 
      : 3600000;
    
    const newStartTime = new Date(date);
    newStartTime.setHours(dropData.hour, originalDate.getMinutes(), 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    onEventMove(eventData.id, newStartTime.getTime(), newEndTime.getTime());
  };

  const eventColumns = useMemo(() => {
    return calculateEventColumns(dayEvents);
  }, [dayEvents]);

  const currentTimePosition = useMemo(() => {
    return currentHour * 60 + now.getMinutes();
  }, [currentHour, now]);

  const getEventPosition = (event: CalendarEvent) => {
    if (!event.startTime) return { top: "0%", height: "100%" };
    const startDate = new Date(event.startTime);
    const top = startDate.getHours() * 60 + startDate.getMinutes();
    const duration = event.endTime && event.startTime 
      ? (event.endTime - event.startTime) / (1000 * 60) 
      : 60;
    return { top: `${top}px`, height: `${Math.max(duration, 20)}px` };
  };

  const getBufferPosition = (buffer: BufferBlock) => {
    const startDate = new Date(buffer.startTime);
    const top = startDate.getHours() * 60 + startDate.getMinutes();
    return { top: `${top}px`, height: `${buffer.duration}px` };
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full overflow-auto">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r border-[var(--border)]">
          <div className="h-12 border-b border-[var(--border)] flex items-center justify-center">
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
          {HOURS.map((hour) => (
            <div key={hour} className="h-[60px] text-xs text-[var(--text-muted)] p-1 text-right pr-2">
              {hourLabels[hour]}
            </div>
          ))}
        </div>

        {/* Day column */}
        <div className="flex-1 relative">
          <div className="h-12 border-b border-[var(--border)] flex items-center justify-center">
            <span className="text-lg font-medium">{format(date, "EEEE, MMMM d")}</span>
          </div>

          {/* Current time line */}
          {isSameDay(date, now) && (
            <div 
              className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none"
              style={{ top: `calc(48px + ${currentTimePosition}px)` }}
            >
              <div className="w-2 h-2 bg-red-500 rounded-full -mt-1 -ml-1" />
            </div>
          )}

          {/* Time slots */}
          <div className="relative">
            {HOURS.map((hour) => (
              <DroppableHour
                key={hour}
                hour={hour}
                onClick={() => handleHourClick(hour)}
              />
            ))}

            {/* Render events with column layout */}
            {dayEvents.map((event) => {
              if (!event.startTime || !event.endTime) return null;
              const startDate = new Date(event.startTime);
              const endDate = new Date(event.endTime);
              
              const startHour = startDate.getHours();
              const startMinutes = startDate.getMinutes();
              const top = startHour * 60 + startMinutes;
              
              const durationMs = endDate.getTime() - startDate.getTime();
              const durationMinutes = durationMs / (1000 * 60);
              const height = Math.max(durationMinutes, 24);
              
              const colInfo = eventColumns.get(event.id) || { column: 0, totalColumns: 1 };
              const gap = 4;
              const usableWidth = 100 - (gap * (colInfo.totalColumns - 1));
              const eventWidth = usableWidth / colInfo.totalColumns;
              const leftPos = colInfo.column * (eventWidth + gap);
              
              const colors = systemColors[event.system as keyof typeof systemColors] || { bg: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-500/20", border: "border-blue-500", text: "text-blue-700 dark:text-blue-400", hover: "hover:bg-blue-50 dark:hover:bg-blue-500/30" };

              return (
                <div
                  key={event.id}
                  onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e); }}
                  className={cn(
                    "absolute rounded-md px-2 py-1 cursor-pointer transition-all duration-200 hover:shadow-md z-20",
                    colors.bgLight,
                    colors.text,
                    `border-l-2 ${colors.border.replace("border-", "border-l-")}`
                  )}
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    left: `${leftPos}%`,
                    width: `${eventWidth}%`
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{event.title}</span>
                  </div>
                  {height > 40 && (
                    <div className="text-xs opacity-70">
                      {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Buffer blocks */}
          <div className="absolute left-20 right-2 top-12 bottom-0 pointer-events-none">
            {dayBuffers.map((buffer) => {
              const { top, height } = getBufferPosition(buffer);
              return (
                <div
                  key={buffer.id}
                  className="absolute left-0 right-0 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-dashed border-yellow-400 dark:border-yellow-500 overflow-hidden"
                  style={{ top, height }}
                >
                  <div className="px-2 py-1 text-xs text-yellow-700 dark:text-yellow-400 truncate">
                    {buffer.duration}m {buffer.purpose}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeEvent && (
          <div className="w-32">
            <EventBlock 
              event={activeEvent} 
              systemColors={systemColors[activeEvent.system as keyof typeof systemColors] || { bg: "bg-blue-500", bgLight: "bg-blue-50 dark:bg-blue-500/20", border: "border-blue-500", text: "text-blue-700 dark:text-blue-400", hover: "hover:bg-blue-50 dark:hover:bg-blue-500/30" }}
              style={{ top: "0px", height: "60px" }}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}