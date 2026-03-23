"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/react";
import { useEncryptedEvents, type EventData } from "@/lib/use-encrypted-events";
import { hasMasterKey } from "@/lib/e2ee";
import { format } from "date-fns";
import { Trash2, Plus, Lock } from "lucide-react";

const SYSTEM_COLORS = {
  Health: "bg-green-500",
  Work: "bg-blue-500",
  Relationships: "bg-purple-500",
};

const SYSTEM_BG_COLORS = {
  Health: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
  Work: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  Relationships: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
};

interface NewEventForm {
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: number;
  endTime: number;
  allDay: boolean;
}

export function EventList() {
  const { userId } = useAuth();
  const { user } = useUser();
  const { events, isDecrypting, error, createEvent, deleteEvent, refresh } = useEncryptedEvents(userId);

  const [showForm, setShowForm] = useState(false);
  const [filterSystem, setFilterSystem] = useState<"All" | "Health" | "Work" | "Relationships">("All");
  const [formData, setFormData] = useState<NewEventForm>(() => {
    const now = Date.now();
    return {
      title: "",
      system: "Work",
      startTime: now,
      endTime: now + 3600000,
      allDay: false,
    };
  });

  const filteredEvents = filterSystem === "All" 
    ? events 
    : events?.filter((event) => event.system === filterSystem) || [];

  useEffect(() => {
    if (events.length >= 0) {
      refresh();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !user?.emailAddresses[0]?.emailAddress) return;

    try {
      await createEvent({
        title: formData.title,
        description: "",
        startTime: formData.startTime,
        endTime: formData.endTime,
        allDay: formData.allDay,
        userId,
        system: formData.system,
        color: SYSTEM_COLORS[formData.system],
      });

      setFormData({
        title: "",
        system: "Work",
        startTime: Date.now(),
        endTime: Date.now() + 3600000,
        allDay: false,
      });
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error("Failed to create event:", err);
    }
  };

  const handleDelete = async (eventId: any) => {
    try {
      await deleteEvent(eventId);
      refresh();
    } catch (err) {
      console.error("Failed to delete event:", err);
    }
  };

  if (!userId) {
    return (
      <div className="text-center py-8 text-gray-500">
        Sign in to view and create events
      </div>
    );
  }

  if (!hasMasterKey()) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Lock className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">App is Locked</h3>
            <p className="text-sm text-gray-500 mt-1">
              Please enter your encryption password to view events
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isDecrypting) {
    return (
      <div className="text-center py-8">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Decrypting your events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-[#F5F1E8]">
            All Events
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{filteredEvents?.length || 0} events</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(["All", "Health", "Work", "Relationships"] as const).map((system) => (
          <button
            key={system}
            onClick={() => setFilterSystem(system)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              filterSystem === system
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            {system}
          </button>
        ))}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card dark:bg-[#3a3436] rounded-lg shadow-sm p-6 border border-border dark:border-gray-700 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-[#F5F1E8] mb-2">
              Event Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border bg-background dark:bg-[#2B262C] dark:border-gray-600 dark:text-[#F5F1E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground dark:text-[#F5F1E8] mb-2">
              System
            </label>
            <select
              value={formData.system}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  system: e.target.value as "Health" | "Work" | "Relationships",
                })
              }
              className="w-full px-3 py-2 border border-border bg-background dark:bg-[#2B262C] dark:border-gray-600 dark:text-[#F5F1E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Health">Health</option>
              <option value="Work">Work</option>
              <option value="Relationships">Relationships</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-[#F5F1E8] mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                value={format(formData.startTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startTime: new Date(e.target.value).getTime(),
                  })
                }
                className="w-full px-3 py-2 border border-border bg-background dark:bg-[#2B262C] dark:border-gray-600 dark:text-[#F5F1E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground dark:text-[#F5F1E8] mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                value={format(formData.endTime, "yyyy-MM-dd'T'HH:mm")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endTime: new Date(e.target.value).getTime(),
                  })
                }
                className="w-full px-3 py-2 border border-border bg-background dark:bg-[#2B262C] dark:border-gray-600 dark:text-[#F5F1E8] rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
              className="w-4 h-4 text-primary border-border rounded"
            />
            <label htmlFor="allDay" className="text-sm text-foreground dark:text-[#F5F1E8]">
              All day event
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              Create Event
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {filteredEvents && filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <div
              key={event._id}
              className={`p-4 rounded-lg border transition-all ${SYSTEM_BG_COLORS[event.system]} hover:shadow-md`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full ${SYSTEM_COLORS[event.system]}`}
                    />
                    <h3 className="font-semibold text-foreground dark:text-[#F5F1E8]">
                      {event.title}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground dark:text-gray-400 mb-3">
                    {event.allDay
                      ? format(event.startTime, "MMMM d, yyyy")
                      : `${format(event.startTime, "MMM d, yyyy h:mm a")} - ${format(
                          event.endTime,
                          "h:mm a"
                        )}`}
                  </p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    event.system === "Health" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                    event.system === "Work" ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" :
                    "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                  }`}>
                    {event.system}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  aria-label="Delete event"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card dark:bg-[#3a3436] rounded-lg border border-border dark:border-gray-700">
            <p className="text-muted-foreground">
              {filterSystem === "All" 
                ? "No events yet. Create one to get started!" 
                : `No ${filterSystem} events. Create one!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
