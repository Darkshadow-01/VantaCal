"use client";

import { useMemo } from "react";
import { format, isToday, isTomorrow, isPast, addDays, startOfDay, isSameDay } from "date-fns";
import { Clock, ChevronRight, CalendarDays } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";
import { expandRecurringEvents, type EventWithRecurrence } from "@/src/features/calendar";
import { cn } from "@/lib/utils";

interface AgendaViewProps {
  date: Date;
  events: CalendarEvent[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onEventClick?: (event: CalendarEvent, e: React.MouseEvent) => void;
}

export function AgendaView({ date, events, systemColors, onEventClick }: AgendaViewProps) {
  const allEvents = useMemo(() => {
    const viewStart = startOfDay(date);
    const viewEnd = addDays(viewStart, 60);
    const expandedEvents = expandRecurringEvents(events as unknown as EventWithRecurrence[], viewStart, "daily").filter(e => 
      e.startTime && e.startTime >= viewStart.getTime() && e.startTime < viewEnd.getTime()
    ) as unknown as CalendarEvent[];
    return expandedEvents.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  }, [events, date]);

  const groupedEvents = useMemo(() => {
    const groups: Map<string, CalendarEvent[]> = new Map();
    
    allEvents.forEach(event => {
      if (!event.startTime) return;
      const eventDate = new Date(event.startTime);
      let label: string;
      
      if (isToday(eventDate)) label = "Today";
      else if (isTomorrow(eventDate)) label = "Tomorrow";
      else if (eventDate.getDay() === 0 && eventDate >= addDays(new Date(), -eventDate.getDay())) label = "This Sunday";
      else if (eventDate.getDay() === 1 && eventDate >= addDays(new Date(), 1 - eventDate.getDay())) label = "This Monday";
      else if (isPast(eventDate) && !isToday(eventDate)) label = "Past";
      else label = format(eventDate, "EEEE, MMMM d");
      
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(event);
    });
    
    return groups;
  }, [allEvents]);

  return (
    <div className="h-full overflow-auto bg-white dark:bg-[#1A1D24]">
      <div className="max-w-3xl mx-auto py-6 px-4">
        {allEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-[#252830] flex items-center justify-center mb-4">
              <CalendarDays className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No events scheduled</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Create an event to see it here</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from(groupedEvents.entries()).map(([label, dayEvents]) => {
              const isTodayGroup = label === "Today";
              const isPastGroup = label === "Past";
              
              return (
                <div key={label}>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className={cn(
                      "text-sm font-medium",
                      isTodayGroup 
                        ? "text-blue-600 dark:text-blue-400" 
                        : isPastGroup 
                          ? "text-gray-400 dark:text-gray-500"
                          : "text-gray-700 dark:text-gray-300"
                    )}>
                      {label}
                    </h3>
                    <div className={cn(
                      "flex- h-px",
                      isTodayGroup ? "bg-blue-200 dark:bg-blue-800" : "bg-gray-200 dark:bg-[#333]"
                    )} />
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-[#252830] px-2 py-0.5 rounded-full">
                      {dayEvents.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const colors = systemColors[event.system as keyof typeof systemColors] || { bg: "bg-blue-500", bgLight: "bg-blue-50", border: "border-blue-500", text: "text-blue-700", hover: "hover:bg-blue-50" };
                      
                      return (
                        <div
                          key={event.id}
                          className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#252830] cursor-pointer transition-all duration-200 group"
                          onClick={(e) => onEventClick?.(event, e)}
                        >
                          <div className="w-14 flex-shrink-0">
                            <div className={cn(
                              "text-sm font-semibold",
                              isTodayGroup ? "text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-200"
                            )}>
                              {event.startTime ? format(new Date(event.startTime), "h:mm") : "--"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {event.startTime ? format(new Date(event.startTime), "a") : ""}
                            </div>
                          </div>
                          <div className={cn("w-1 h-10 rounded-full", colors.bg)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 dark:text-white truncate">
                                {event.title}
                              </span>
                              {event.allDay && (
                                <span className="text-xs text-gray-400 bg-gray-100 dark:bg-[#252830] px-1.5 py-0.5 rounded">
                                  All day
                                </span>
                              )}
                            </div>
                            {(event.location || event.description) && (
                              <div className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {event.location || event.description}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}