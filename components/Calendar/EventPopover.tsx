"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Clock, MapPin, Repeat, Sparkles, Calendar, AlertTriangle, CheckCircle } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";

interface EventPopoverProps {
  event: CalendarEvent;
  aiInsights?: {
    avgDuration?: number;
    completionRate?: number;
    typicalPattern?: string;
    delayRisk?: "low" | "medium" | "high";
  };
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function EventPopover({ event, aiInsights, onClose, onEdit, onDelete }: EventPopoverProps) {
  const startTime = event.startTime ? new Date(event.startTime) : new Date();
  const endTime = event.endTime ? new Date(event.endTime) : new Date(startTime.getTime() + 3600000);
  const isValidTime = !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());
  const durationMinutes = isValidTime ? (endTime.getTime() - startTime.getTime()) / (1000 * 60) : 60;

  const getSystemColor = (system?: string) => {
    const colors: Record<string, string> = {
      Health: "bg-green-500",
      Work: "bg-blue-500",
      Relationships: "bg-purple-500",
    };
    return colors[system || ""] || "bg-gray-500";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div 
        className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with system color */}
        <div className={`${getSystemColor(event.system)} p-4 text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-white/20 rounded text-sm">
                  {event.system}
                </span>
                {event.recurrence && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-sm">
                    <Repeat className="w-3 h-3" />
                    {typeof event.recurrence === 'string' ? event.recurrence : String(event.recurrence?.type)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <span className="text-2">&times;</span>
            </button>
          </div>
        </div>

        {/* Event Details */}
        <div className="p-4 space-y-4">
          {/* Time */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {format(startTime, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                <span className="ml-2 text-gray-500">({durationMinutes} min)</span>
              </p>
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  {event.location}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {event.description}
              </p>
            </div>
          )}

          {/* AI Insights */}
          {aiInsights && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  AI Insights
                </span>
              </div>
              <div className="space-y-2">
                {aiInsights.avgDuration && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Typical duration:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {aiInsights.avgDuration} min
                    </span>
                  </div>
                )}
                {aiInsights.completionRate !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Completion rate:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {aiInsights.completionRate}%
                    </span>
                  </div>
                )}
                {aiInsights.typicalPattern && (
                  <div className="flex items-start gap-2 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Pattern:</span>
                    <span className="text-gray-900 dark:text-white">
                      {aiInsights.typicalPattern}
                    </span>
                  </div>
                )}
                {aiInsights.delayRisk && (
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className={`w-4 h-4 ${
                      aiInsights.delayRisk === "high" ? "text-red-500" :
                      aiInsights.delayRisk === "medium" ? "text-yellow-500" : "text-green-500"
                    }`} />
                    <span className="text-gray-900 dark:text-white capitalize">
                      {aiInsights.delayRisk} delay risk
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t dark:border-gray-700">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Event
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-lg transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MiniEventPopover({ event, position }: { event: CalendarEvent; position: { x: number; y: number } }) {
  return (
    <div 
      className="fixed z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-3 min-w-[250px] pointer-events-none"
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -100%)",
      }}
    >
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 dark:text-white truncate">
          {event.title}
        </h4>
        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <p>
            {event.startTime ? format(new Date(event.startTime), "h:mm a") : "All day"} - {event.endTime ? format(new Date(event.endTime), "h:mm a") : ""}
          </p>
          <p className="capitalize">{event.system}</p>
        </div>
      </div>
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800" />
    </div>
  );
}
