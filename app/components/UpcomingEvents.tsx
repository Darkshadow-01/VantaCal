"use client";
/* eslint-disable react-hooks/purity */

import { useMemo, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "@clerk/react";
import { useEncryptedEvents } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { Clock, MapPin, Trash2, Lock } from "lucide-react";

const SYSTEM_COLORS = {
  Health: {
    bg: "bg-green-500",
    bgLight: "bg-green-50 dark:bg-green-900/20",
    border: "border-green-500",
  },
  Work: {
    bg: "bg-blue-500",
    bgLight: "bg-blue-50 dark:bg-blue-900/20",
    border: "border-blue-500",
  },
  Relationships: {
    bg: "bg-purple-500",
    bgLight: "bg-purple-50 dark:bg-purple-900/20",
    border: "border-purple-500",
  },
};

export function UpcomingEvents() {
  const { userId } = useAuth();
  const { events, deleteEvent, isDecrypting } = useEncryptedEvents(userId ?? undefined);
  const nowRef = useRef<number>(0);

  const upcomingEvents = useMemo(() => {
    if (!events) return [];
    const now = nowRef.current || Date.now();
    return events
      .filter((e) => e.startTime >= now)
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, 5);
  }, [events]);

  const handleDelete = async (eventId: any) => {
    await deleteEvent(eventId);
  };

  if (!hasMasterKey()) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6 flex items-center justify-center h-48">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Lock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Unlock app to view events</p>
        </div>
      </div>
    );
  }

  if (upcomingEvents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Events
        </h3>
        {isDecrypting ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            Decrypting events...
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">
            No upcoming events. Create one to get started!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
        Upcoming Events
      </h3>

      <div className="space-y-3">
        {upcomingEvents.map((event) => {
          const colors = SYSTEM_COLORS[event.system];
          const start = new Date(event.startTime);
          const end = new Date(event.endTime);

          return (
            <div
              key={event._id}
              className={`p-3 rounded-lg border-l-4 ${colors.border} ${colors.bgLight}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
                    <h4 className="font-medium text-gray-900 dark:text-white truncate">
                      {event.title}
                    </h4>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {format(start, "MMM d")} · {format(start, "h:mm a")} - {format(end, "h:mm a")}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>

                  <span className={`inline-block mt-2 px-2 py-0.5 text-xs font-medium rounded ${colors.bg} text-white`}>
                    {event.system}
                  </span>
                </div>

                <button
                  onClick={() => handleDelete(event._id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
