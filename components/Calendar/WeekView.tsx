"use client";

import { useMemo, useState } from "react";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isToday,
  getWeek,
} from "date-fns";
import { DndContext, DragEndEvent, DragOverlay, useDraggable, useDroppable, DragStartEvent } from "@dnd-kit/core";
import type { CalendarEvent } from "@/lib/types";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";
import { expandRecurringEvents, type EventWithRecurrence } from "@/src/features/calendar";
import { cn } from "@/lib/utils";

interface WeeklyViewProps {
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

function DroppableHour({ day, hour, onClick, onDoubleClick, isCurrentHour, children }: {
  day: Date;
  hour: number;
  onClick?: () => void;
  onDoubleClick?: () => void;
  isCurrentHour?: boolean;
  children?: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${format(day, "yyyy-MM-dd")}-${hour}`,
    data: { day, hour },
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={cn(
        "h-16 border-b border-r border-[var(--border)] cursor-pointer transition-colors relative",
        isOver ? "bg-[var(--bg-secondary)]" : "hover:bg-[var(--bg-secondary)]/50"
      )}
    >
      {children}
      {isCurrentHour && (
        <div className="absolute left-0 right-0 h-0.5 bg-red-500 pointer-events-none z-10" />
      )}
    </div>
  );
}

export function WeekView({ 
  date, 
  events, 
  buffers, 
  systemColors, 
  onSlotClick, 
  onEventClick, 
  onEventMove,
}: WeeklyViewProps) {
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  
  const weekStart = startOfWeek(date);
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const eventsByDay = useMemo(() => {
    const expandedEvents = expandRecurringEvents(events as unknown as EventWithRecurrence[], weekDays[0], "weekly") as unknown as CalendarEvent[];
    const map = new Map<string, CalendarEvent[]>();
    weekDays.forEach((day) => map.set(format(day, "yyyy-MM-dd"), []));
    
    expandedEvents.forEach((event) => {
      if (!event.startTime) return;
      const eventDate = new Date(event.startTime);
      const key = format(eventDate, "yyyy-MM-dd");
      if (map.has(key)) map.get(key)!.push(event);
    });
    return map;
  }, [events, weekDays]);

  const currentHour = new Date().getHours();

  const handleDragStart = (event: DragStartEvent) => {
    const eventData = event.active.data.current as CalendarEvent;
    setActiveEvent(eventData);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveEvent(null);
    
    if (!over || !onEventMove) return;
    
    const eventData = active.data.current as CalendarEvent;
    const dropData = over.data.current as { day: Date; hour: number };
    
    if (!eventData?.startTime || !dropData) return;
    
    const originalDate = new Date(eventData.startTime);
    const duration = eventData.endTime && eventData.startTime 
      ? eventData.endTime - eventData.startTime 
      : 3600000;
    
    const newStartTime = new Date(dropData.day);
    newStartTime.setHours(dropData.hour, originalDate.getMinutes(), 0, 0);
    const newEndTime = new Date(newStartTime.getTime() + duration);
    
    onEventMove(eventData.id, newStartTime.getTime(), newEndTime.getTime());
  };

  const handleHourClick = (day: Date, hour: number) => {
    onSlotClick?.(day, hour);
  };

  const hourLabels = HOURS.map((hour) => 
    format(new Date().setHours(hour, 0), "h a")
  );

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-full overflow-auto bg-[var(--bg-primary)]">
        {/* Week numbers column */}
        <div className="w-10 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="h-16 border-b border-[var(--border)] flex items-end justify-center pb-1">
            <span className="text-[10px] text-[var(--text-muted)]">Wk</span>
          </div>
          {weekDays.map((day, idx) => {
            const weekNum = getWeek(day, { weekStartsOn: 0 });
            return (
              <div key={idx} className="h-16 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]">
                {weekNum}
              </div>
            );
          })}
        </div>

        {/* Time column */}
        <div className="w-12 flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="h-16 border-b border-[var(--border)]" />
          {HOURS.map((hour) => (
            <div key={hour} className="h-16 text-[10px] text-[var(--text-muted)] pr-1 text-right leading-[4rem]">
              {hourLabels[hour]}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="flex-1 flex min-w-0">
          {weekDays.map((day, dayIndex) => {
            const isCurrentDay = isToday(day);
            const dayKey = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDay.get(dayKey) || [];
            const dayEventColumns = useMemo(() => calculateEventColumns(dayEvents), [dayEvents]);

            return (
              <div key={dayIndex} className="flex-1 min-w-[120px] border-r border-[var(--border)]">
                {/* Day header */}
                <div className={cn(
                  "h-16 flex flex-col items-center justify-center border-b transition-colors",
                  isCurrentDay ? "bg-[var(--bg-secondary)]" : ""
                )}>
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    {format(day, "EEE")}
                  </span>
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mt-1 transition-all duration-300",
                    isCurrentDay 
                      ? "bg-[var(--accent)] text-[var(--accent-contrast)]" 
                      : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>

                {/* Time slots */}
                <div className="relative">
                  {HOURS.map((hour) => (
                    <DroppableHour
                      key={hour}
                      day={day}
                      hour={hour}
                      isCurrentHour={isCurrentDay && hour === currentHour}
                      onClick={() => handleHourClick(day, hour)}
                      onDoubleClick={() => onSlotClick?.(day, hour)}
                    />
                  ))}

                  {/* Events for this day */}
                  {dayEvents.map((event) => {
                    if (!event.startTime || !event.endTime) return null;
                    const startDate = new Date(event.startTime);
                    const endDate = new Date(event.endTime);
                    
                    const startHour = startDate.getHours();
                    const startMinutes = startDate.getMinutes();
                    const top = startHour * 64 + startMinutes;
                    
                    const durationMs = endDate.getTime() - startDate.getTime();
                    const durationMinutes = durationMs / (1000 * 60);
                    const height = Math.max(durationMinutes * (64 / 60), 24);
                    
                    // Get column info for overlapping events
                    const colInfo = dayEventColumns.get(event.id) || { column: 0, totalColumns: 1 };
                    const gap = 4;
                    const usableWidth = 100 - (gap * (colInfo.totalColumns - 1));
                    const eventWidth = usableWidth / colInfo.totalColumns;
                    const leftPos = colInfo.column * (eventWidth + gap);
                    
                    const colors = systemColors[event.system as keyof typeof systemColors] || { bg: "bg-[var(--accent)]", bgLight: "bg-[var(--bg-secondary)]", border: "border-[var(--accent)]", text: "text-[var(--text-primary)]", hover: "hover:bg-[var(--bg-secondary)]" };

                    return (
                      <div
                        key={event.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick?.(event, e); }}
                        className={cn(
                          "absolute rounded-md px-2 py-0.5 cursor-pointer transition-all duration-200 hover:shadow-md z-10",
                          colors.bgLight,
                          colors.text,
                          `border-l-2 ${colors.border.replace("border-", "border-l-")}`
                        )}
                        style={{ 
                          top: `${top + 2}px`, 
                          height: `${height - 4}px`,
                          left: `${leftPos}%`,
                          width: `${eventWidth}%`
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{event.title}</span>
                        </div>
                        {height > 40 && (
                          <div className="text-[10px] opacity-70">
                            {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DragOverlay>
        {activeEvent && (
          <div className={cn(
            "px-3 py-2 rounded-lg text-sm font-medium text-white shadow-xl z-50",
            systemColors[activeEvent.system as keyof typeof systemColors]?.bg || "bg-[var(--accent)]"
          )}>
            {activeEvent.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}