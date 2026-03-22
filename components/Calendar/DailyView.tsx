"use client";

import { useMemo } from "react";
import { format, isSameDay, setHours } from "date-fns";
import { Clock, AlertTriangle } from "lucide-react";
import { EventBlock } from "./EventBlock";
import type { EventData } from "@/lib/use-encrypted-events";
import type { BufferBlock } from "@/lib/schedulerWithBuffers";

interface DailyViewProps {
  date: Date;
  events: EventData[];
  buffers: BufferBlock[];
  systemColors: Record<string, any>;
  onSlotClick?: (date: Date, hour: number) => void;
  onEventClick?: (event: EventData, e: React.MouseEvent) => void;
  selectedEvents?: EventData[];
  onEventSelect?: (event: EventData) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DailyView({ date, events, buffers, systemColors, onSlotClick, onEventClick, selectedEvents = [], onEventSelect }: DailyViewProps) {
  const dayEvents = useMemo(() => {
    return events.filter((event) => isSameDay(new Date(event.startTime), date));
  }, [events, date]);

  const dayBuffers = useMemo(() => {
    return buffers.filter((buffer) => {
      return isSameDay(new Date(buffer.startTime), date);
    });
  }, [buffers, date]);

  const getEventPosition = (event: EventData) => {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const topPercent = (startMinutes / (24 * 60)) * 100;
    const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return {
      top: `${topPercent}%`,
      height: `${Math.max(heightPercent, 2)}%`,
    };
  };

  const getBufferPosition = (buffer: BufferBlock) => {
    const start = new Date(buffer.startTime);
    const end = new Date(buffer.endTime);
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const topPercent = (startMinutes / (24 * 60)) * 100;
    const heightPercent = ((endMinutes - startMinutes) / (24 * 60)) * 100;
    return {
      top: `${topPercent}%`,
      height: `${Math.max(heightPercent, 1)}%`,
    };
  };

  const getBufferConfig = (buffer: BufferBlock) => {
    const configs = {
      transition: {
        bg: "bg-gray-200 dark:bg-gray-600",
        label: "Transition",
        icon: Clock,
      },
      recovery: {
        bg: "bg-amber-200 dark:bg-amber-700",
        label: "Recovery",
        icon: Clock,
      },
      buffer: {
        bg: "bg-blue-200 dark:bg-blue-700",
        label: "Buffer",
        icon: Clock,
      },
      travel: {
        bg: "bg-purple-200 dark:bg-purple-700",
        label: "Travel",
        icon: Clock,
      },
    };
    return configs[buffer.purpose] || configs.buffer;
  };

  return (
    <div className="flex flex-col lg:flex-row h-[800px]">
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Hour markers */}
          <div className="absolute left-16 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="flex h-16 border-b border-gray-100 dark:border-gray-700 relative"
            >
              <div className="w-16 flex-shrink-0 pr-2 text-right text-xs text-gray-500 dark:text-gray-400 -mt-2">
                {format(new Date().setHours(hour, 0, 0, 0), "h a")}
              </div>
              <div 
                className="flex-1 relative hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                onClick={() => onSlotClick?.(new Date(date), hour)}
              >
                {/* Current time indicator */}
                {new Date().getHours() === hour && isSameDay(new Date(), date) && (
                  <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-20">
                    <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Events Layer */}
          <div className="absolute left-16 right-0 top-0 bottom-0">
            {dayEvents.map((event) => {
              const { top, height } = getEventPosition(event);
              return (
                <EventBlock
                  key={event._id}
                  event={event}
                  systemColors={systemColors[event.system]}
                  onClick={(e) => onEventClick?.(event, e)}
                  style={{ top, height }}
                  showBuffer={false}
                />
              );
            })}
          </div>

          {/* Buffer Blocks Layer */}
          <div className="absolute left-20 right-2 top-0 bottom-0 opacity-60">
            {dayBuffers.map((buffer) => {
              const { top, height } = getBufferPosition(buffer);
              const config = getBufferConfig(buffer);
              return (
                <div
                  key={buffer.id}
                  className={`absolute left-0 right-0 ${config.bg} rounded border border-dashed border-gray-400 dark:border-gray-500 overflow-hidden`}
                  style={{ top, height: `${height}%` }}
                  title={`${config.label}: ${buffer.duration}min${buffer.recommended ? " (recommended)" : ""}`}
                >
                  <div className="px-2 py-1 text-xs text-gray-700 dark:text-gray-200 truncate">
                    <div className="flex items-center gap-1">
                      <config.icon className="w-3 h-3" />
                      <span>{buffer.duration}m {config.label}</span>
                      {buffer.recommended && (
                        <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full lg:w-80 border-l dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Day Overview
        </h3>

        {/* Stats */}
        <div className="space-y-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {dayEvents.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {dayBuffers.reduce((sum, b) => sum + b.duration, 0)}min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Buffer Time</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dayEvents.reduce((sum, e) => {
                const start = new Date(e.startTime);
                const end = new Date(e.endTime);
                return sum + (end.getTime() - start.getTime()) / (1000 * 60);
              }, 0).toFixed(0)}min
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Event Time</div>
          </div>
        </div>

        {/* Event List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Events ({dayEvents.length})
          </h4>
          {dayEvents.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No events scheduled</p>
          ) : (
            dayEvents.map((event) => (
              <div
                key={event._id}
                className={`${systemColors[event.system]?.bg || "bg-gray-500"} rounded-lg p-3 text-white shadow-sm cursor-pointer hover:opacity-90`}
                onClick={(e) => onEventClick?.(event, e)}
              >
                <div className="font-medium">{event.title}</div>
                <div className="text-xs opacity-80">
                  {format(new Date(event.startTime), "h:mm a")} -{" "}
                  {format(new Date(event.endTime), "h:mm a")}
                </div>
                <div className="text-xs opacity-70 mt-1">{event.system}</div>
              </div>
            ))
          )}
        </div>

        {/* Buffer List */}
        {dayBuffers.length > 0 && (
          <div className="mt-6 space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Buffers ({dayBuffers.length})
            </h4>
            {dayBuffers.map((buffer) => {
              const config = getBufferConfig(buffer);
              return (
                <div
                  key={buffer.id}
                  className={`${config.bg} rounded-lg p-3 shadow-sm`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    {config.label} ({buffer.duration}min)
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {format(new Date(buffer.startTime), "h:mm a")} -{" "}
                    {format(new Date(buffer.endTime), "h:mm a")}
                  </div>
                  {buffer.recommended && (
                    <div className="flex items-center gap-1 mt-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-600" />
                      <span className="text-xs text-yellow-700">Recommended</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
