"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2, Clock, AlertTriangle } from "lucide-react";
import type { CalendarEvent } from "@/lib/types";

interface SystemColors {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  hover: string;
}

interface EventBlockProps {
  event: CalendarEvent;
  systemColors: SystemColors;
  onClick: (e: React.MouseEvent) => void;
  style?: { top: string; height: string };
  compact?: boolean;
  showBuffer?: boolean;
  delayRisk?: "low" | "medium" | "high";
}

export function EventBlock({
  event,
  systemColors,
  onClick,
  style,
  compact = false,
  showBuffer = true,
}: EventBlockProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const startTime = event.startTime ? new Date(event.startTime) : new Date();
  const endTime = event.endTime ? new Date(event.endTime) : new Date(startTime.getTime() + 3600000);
  const isValidTime = !isNaN(startTime.getTime()) && !isNaN(endTime.getTime());
  const durationMinutes = isValidTime ? (endTime.getTime() - startTime.getTime()) / (1000 * 60) : 60;

  const getBorderColor = () => {
    switch (event.system) {
      case "Health": return "#16A34A";
      case "Work": return "#2563EB";
      case "Relationships": return "#9333EA";
      default: return "#57534E";
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.effectAllowed = "move";
  };

  if (compact) {
    return (
      <button
        className={`
          ${systemColors.bg} text-white px-2 py-1 rounded text-xs truncate cursor-pointer
          hover:opacity-90 transition-opacity shadow-sm hover:scale-[1.02] active:scale-[0.98]
        `}
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
      >
        {event.title}
      </button>
    );
  }

  const getEventBg = () => {
    switch (event.system) {
      case "Health": return "#16A34A";
      case "Work": return "#374151";
      case "Relationships": return "#9333EA";
      default: return "#57534E";
    }
  };

  return (
    <div
      className={`
        absolute left-1 right-1 rounded-lg cursor-pointer
        transition-all shadow-md overflow-hidden
        hover:shadow-lg hover:scale-[1.01] hover:translate-x-0.5
        ${showBuffer ? "border-l-4" : ""}
      `}
      style={{
        top: style?.top || "0",
        height: style?.height || "100%",
        minHeight: "28px",
        backgroundColor: getEventBg(),
        borderLeftColor: getEventBg(),
      }}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      draggable
      onDragStart={handleDragStart}
    >
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-full ml-2 top-0 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 p-3 min-w-[200px] pointer-events-none">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
              {event.title}
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>
                  {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Duration:</span>
                <span>{durationMinutes} minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">System:</span>
                <span
                  className={`px-2 py-0.5 rounded text-white ${systemColors.bg}`}
                >
                  {event.system}
                </span>
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Location:</span>
                  <span>{event.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-1 h-full">
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="font-semibold text-sm truncate leading-tight text-white">{event.title}</p>
          {!compact && (
            <p className="text-xs opacity-90 mt-0.5 font-medium">
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </p>
          )}
        </div>

        {/* Menu Button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <MoreVertical className="w-3 h-3" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-20 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClick(e);
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-gray-900 dark:text-white"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}