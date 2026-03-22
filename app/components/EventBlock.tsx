"use client";

import { format } from "date-fns";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import type { EventData } from "@/lib/use-encrypted-events";
import { useState } from "react";

interface SystemColors {
  bg: string;
  bgLight: string;
  border: string;
  text: string;
  hover: string;
}

interface EventBlockProps {
  event: EventData;
  systemColors: SystemColors;
  onClick: (e: React.MouseEvent) => void;
  style?: { top: string; height: string };
  compact?: boolean;
}

export function EventBlock({ event, systemColors, onClick, style, compact = false }: EventBlockProps) {
  const [showMenu, setShowMenu] = useState(false);
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);

  const handleDragStart = (e: React.DragEvent) => {
    if (event._id) {
      e.dataTransfer.setData("eventId", event._id);
    }
    e.dataTransfer.effectAllowed = "move";
  };

  if (compact) {
    return (
      <div
        className={`
          ${systemColors.bg} text-white px-2 py-1 rounded text-xs truncate cursor-pointer
          hover:opacity-90 transition-opacity
        `}
        onClick={onClick}
        draggable
        onDragStart={handleDragStart}
      >
        {event.title}
      </div>
    );
  }

  return (
    <div
      className={`
        absolute left-1 right-1 ${systemColors.bgLight} ${systemColors.border} border-l-4
        ${systemColors.text} px-2 py-1 rounded-r-md cursor-pointer
        hover:opacity-90 transition-all shadow-sm overflow-hidden
      `}
      style={{
        top: style?.top || "0",
        height: style?.height || "100%",
        minHeight: "24px",
      }}
      onClick={onClick}
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{event.title}</p>
          {!compact && (
            <p className="text-xs opacity-80">
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </p>
          )}
        </div>
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 hover:bg-black/10 rounded transition-colors"
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
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-red-600"
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
