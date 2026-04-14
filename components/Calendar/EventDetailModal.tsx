"use client";

import { useState } from "react";
import { X, Calendar as CalendarIcon, Clock, MapPin, Users, Check } from "lucide-react";
import type { CalendarEvent, Calendar } from "@/lib/types";
import { MONTHS, DAYS } from "@/lib/constants";
import { format } from "date-fns";

interface EventDetailModalProps {
  isOpen: boolean;
  event: CalendarEvent | null;
  calendars: Calendar[];
  onClose: () => void;
  onEdit: () => void;
  onDelete: (eventId: string, deleteAll?: boolean) => void;
  onToggleComplete?: (eventId: string) => void;
  onUpdateDuration?: (eventId: string, actualDuration: number) => void;
}

export function EventDetailModal({
  isOpen, 
  event, 
  calendars, 
  onClose, 
  onEdit, 
  onDelete,
  onToggleComplete,
  onUpdateDuration,
}: EventDetailModalProps) {
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  
  const calendar = calendars.find(c => c.id === event?.calendarId);
  const isRecurring = event?.recurringEventId || event?.isRecurringInstance;

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-[#1A1D24] rounded-xl w-full max-w-md border border-gray-200 dark:border-[#333] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-[#333] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: event.color }} />
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{event.type}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-[#252830] rounded">
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {event.type === "task" && onToggleComplete && (
              <button 
                onClick={() => onToggleComplete(event.id)}
                className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${event.completed ? "bg-green-500 border-green-500" : "border-gray-500 hover:border-green-500"}`}
              >
                {event.completed && <Check className="w-4 h-4 text-white" />}
              </button>
            )}
            <div className="flex-1">
              <h2 className={`text-xl font-semibold ${event.completed ? "line-through text-gray-500 dark:text-gray-500" : "text-gray-900 dark:text-white"}`}>
                {event.title}
              </h2>
              {event.type === "task" && onUpdateDuration && (
                <div className="mt-2">
                  <label className="text-xs text-gray-500 dark:text-gray-400">
                    Actual time (min):
                  </label>
                  <input
                    type="number"
                    className="ml-2 w-16 text-sm border border-gray-300 dark:border-[#333] rounded px-2 py-0.5 bg-white dark:bg-[#252830] text-gray-900 dark:text-white"
                    placeholder={event.actualDuration?.toString() || "60"}
                    onBlur={(e) => {
                      const mins = parseInt(e.target.value);
                      if (mins > 0) {
                        onUpdateDuration(event.id, mins);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            {event.startTime && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <CalendarIcon className="w-5 h-5 text-gray-500" />
                <span>{format(new Date(event.startTime), "MMMM d, yyyy")}</span>
              </div>
            )}
            
            {event.startTime && event.endTime && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Clock className="w-5 h-5 text-gray-500" />
                <span>{format(new Date(event.startTime), "h:mm a")} - {format(new Date(event.endTime), "h:mm a")}</span>
              </div>
            )}
            
            {event.location && (
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.guests && event.guests.length > 0 && (
              <div className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                <Users className="w-5 h-5 text-gray-500 mt-0.5" />
                <div className="flex flex-wrap gap-1">
                  {event.guests.map((guest, idx) => (
                    <span key={idx} className="bg-gray-200 dark:bg-[#252830] px-2 py-1 rounded-full text-sm text-gray-700 dark:text-gray-300">{guest}</span>
                  ))}
                </div>
              </div>
            )}
            
            {event.description && (
              <div className="text-gray-700 dark:text-gray-300 text-sm border-t border-gray-200 dark:border-[#333] pt-3 mt-2">
                <p className="text-gray-500 text-xs uppercase mb-1">Description</p>
                <p>{event.description}</p>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" style={{ borderColor: event.color }}>
                {calendar?.visible && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: event.color }} />}
              </div>
              <span>{calendar?.name || "Calendar"}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-200 dark:border-[#333]">
          {showDeleteOptions ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2">
                This is a recurring event. What would you like to delete?
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { onDelete(event.id, false); setShowDeleteOptions(false); }} 
                  className="flex-1 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors text-sm"
                >
                  This event only
                </button>
                <button 
                  onClick={() => { onDelete(event.id, true); setShowDeleteOptions(false); }} 
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  All events
                </button>
              </div>
              <button 
                onClick={() => setShowDeleteOptions(false)} 
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mt-2"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button onClick={onEdit} className="flex-1 py-2 bg-stone-600 hover:bg-stone-700 text-white rounded-lg font-medium transition-colors">
                Edit
              </button>
              {isRecurring ? (
                <button 
                  onClick={() => setShowDeleteOptions(true)} 
                  className="flex-1 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors"
                >
                  Delete
                </button>
              ) : (
                <button onClick={() => onDelete(event.id)} className="flex-1 py-2 bg-red-100 dark:bg-red-500/20 hover:bg-red-200 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 rounded-lg font-medium transition-colors">
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
