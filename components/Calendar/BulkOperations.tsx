"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Tag, Calendar, Move, CheckSquare, Square, X } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";

interface BulkOperationsProps {
  selectedEvents: EventData[];
  events: EventData[];
  onEventsChange: (events: EventData[]) => void;
  systemColors: Record<string, any>;
}

export function BulkOperations({
  selectedEvents,
  events,
  onEventsChange,
  systemColors,
}: BulkOperationsProps) {
  const [showActions, setShowActions] = useState(false);

  const handleSelectAll = () => {
    if (selectedEvents.length === events.length) {
      onEventsChange([]);
    } else {
      onEventsChange([...events]);
    }
  };

  const handleDeleteSelected = () => {
    const selectedIds = new Set(selectedEvents.map((e) => e._id));
    const updated = events.filter((e) => !selectedIds.has(e._id));
    onEventsChange(updated);
  };

  const handleChangeSystem = (system: "Health" | "Work" | "Relationships") => {
    const selectedIds = new Set(selectedEvents.map((e) => e._id));
    const updated = events.map((e) =>
      selectedIds.has(e._id)
        ? { ...e, system, color: systemColors[system].bg }
        : e
    );
    onEventsChange(updated);
  };

  const handleReschedule = (days: number) => {
    const selectedIds = new Set(selectedEvents.map((e) => e._id));
    const msPerDay = 24 * 60 * 60 * 1000;
    const updated = events.map((e) =>
      selectedIds.has(e._id)
        ? {
            ...e,
            startTime: e.startTime + days * msPerDay,
            endTime: e.endTime + days * msPerDay,
          }
        : e
    );
    onEventsChange(updated);
  };

  if (selectedEvents.length === 0) {
    return (
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-700">
        <button
          onClick={handleSelectAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
        >
          {events.length === selectedEvents.length ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          Select All ({events.length})
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border-b dark:border-gray-700 space-y-3">
      {/* Selection Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-blue-600 text-white text-sm font-medium rounded">
            {selectedEvents.length} selected
          </span>
          <button
            onClick={() => onEventsChange([])}
            className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded transition-colors"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
        <button
          onClick={handleSelectAll}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {selectedEvents.length === events.length ? "Deselect All" : "Select All"}
        </button>
      </div>

      {/* Selected Events List */}
      <div className="max-h-32 overflow-y-auto space-y-1">
        {selectedEvents.map((event) => (
          <div
            key={event._id}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
          >
            <div className={`w-2 h-2 rounded-full ${systemColors[event.system]?.bg || "bg-gray-500"}`} />
            <span className="flex-1 truncate">{event.title}</span>
            <span className="text-xs text-gray-500">
              {format(new Date(event.startTime), "MMM d")}
            </span>
          </div>
        ))}
      </div>

      {/* Bulk Actions */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-200 dark:border-blue-800">
        {/* Delete */}
        <button
          onClick={handleDeleteSelected}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>

        {/* Change System */}
        <div className="flex items-center gap-1">
          <Tag className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Change to:</span>
          {(["Health", "Work", "Relationships"] as const).map((system) => (
            <button
              key={system}
              onClick={() => handleChangeSystem(system)}
              className="px-2 py-1 text-xs rounded transition-colors hover:opacity-80"
              style={{ backgroundColor: systemColors[system]?.bg.replace("bg-", "") }}
            >
              {system}
            </button>
          ))}
        </div>

        {/* Reschedule */}
        <div className="flex items-center gap-1 ml-auto">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Move:</span>
          <button
            onClick={() => handleReschedule(-1)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            -1 day
          </button>
          <button
            onClick={() => handleReschedule(1)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +1 day
          </button>
          <button
            onClick={() => handleReschedule(7)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            +1 week
          </button>
        </div>
      </div>
    </div>
  );
}

export function EventCheckbox({
  event,
  isSelected,
  onToggle,
}: {
  event: EventData;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`
        p-1 rounded transition-colors
        ${isSelected ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}
      `}
    >
      {isSelected ? (
        <CheckSquare className="w-4 h-4" />
      ) : (
        <Square className="w-4 h-4" />
      )}
    </button>
  );
}

export function useBulkSelection(initialEvents: EventData[]) {
  const [selectedEvents, setSelectedEvents] = useState<EventData[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const toggleEvent = (event: EventData) => {
    const isSelected = selectedEvents.some((e) => e._id === event._id);
    if (isSelected) {
      setSelectedEvents(selectedEvents.filter((e) => e._id !== event._id));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const selectAll = () => {
    setSelectedEvents([...initialEvents]);
  };

  const deselectAll = () => {
    setSelectedEvents([]);
  };

  const isEventSelected = (eventId: string) => {
    return selectedEvents.some((e) => e._id === eventId);
  };

  return {
    selectedEvents,
    isSelecting,
    setIsSelecting,
    toggleEvent,
    selectAll,
    deselectAll,
    isEventSelected,
  };
}
