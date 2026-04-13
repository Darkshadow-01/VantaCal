"use client";

import { useState, useEffect, useCallback } from "react";
import { format, differenceInMinutes } from "date-fns";
import { Bell, BellOff, Clock, CheckCircle, XCircle } from "lucide-react";
import { hasMasterKey } from "@/lib/e2ee";
import type { CalendarEvent } from "@/lib/types";

export interface Reminder {
  id: string;
  eventId: string;
  minutesBefore: number;
  sent: boolean;
  acknowledged: boolean;
}

interface NotificationCenterProps {
  events: CalendarEvent[];
  reminders: Reminder[];
  onReminderChange: (reminders: Reminder[]) => void;
}

const PRESET_REMINDERS = [
  { minutes: 5, label: "5 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
];

export function NotificationCenter({
  events,
  reminders,
  onReminderChange,
}: NotificationCenterProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [activeReminders, setActiveReminders] = useState<Reminder[]>(reminders);
  const [showSettings, setShowSettings] = useState(false);

  const updateReminderStatus = (reminderId: string, updates: Partial<Reminder>) => {
    const updated = activeReminders.map((r) =>
      r.id === reminderId ? { ...r, ...updates } : r
    );
    setActiveReminders(updated);
    onReminderChange(updated);
  };

  const sendNotification = (event: CalendarEvent, reminder: Reminder) => {
    if (permission !== "granted") return;

    const minutesLabel = reminder.minutesBefore >= 60
      ? `${reminder.minutesBefore / 60} hour${reminder.minutesBefore >= 120 ? "s" : ""}`
      : `${reminder.minutesBefore} minute${reminder.minutesBefore !== 1 ? "s" : ""}`;

    const eventStart = event.startTime ? new Date(event.startTime) : null;
    const isValidStart = eventStart && !isNaN(eventStart.getTime());
    const timeStr = isValidStart ? format(eventStart, "h:mm a") : "TBD";

    const notification = new Notification(`${event.title} starting soon`, {
      body: `Starts in ${minutesLabel} at ${timeStr}`,
      icon: "/calendar-icon.png",
      tag: reminder.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  };

  const checkAndSendReminders = useCallback(() => {
    const now = Date.now();

    activeReminders.forEach((reminder) => {
      if (reminder.sent) return;

      const event = events.find((e) => e.id === reminder.eventId);
      if (!event || !event.startTime) return;

      const reminderTime = event.startTime - reminder.minutesBefore * 60 * 1000;
      const timeDiff = reminderTime - now;

      if (timeDiff <= 0 && timeDiff > -60000) {
        sendNotification(event, reminder);
        updateReminderStatus(reminder.id, { sent: true });
      }
    });
  }, [events, activeReminders, sendNotification, updateReminderStatus]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      checkAndSendReminders();
    }, 30000);

    return () => clearInterval(interval);
  }, [events, activeReminders, checkAndSendReminders]);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
    }
  };

  const addReminder = (eventId: string, minutes: number) => {
    const newReminder: Reminder = {
      id: `reminder-${eventId}-${minutes}`,
      eventId,
      minutesBefore: minutes,
      sent: false,
      acknowledged: false,
    };

    const updated = [...activeReminders, newReminder];
    setActiveReminders(updated);
    onReminderChange(updated);
  };

  const removeReminder = (reminderId: string) => {
    const updated = activeReminders.filter((r) => r.id !== reminderId);
    setActiveReminders(updated);
    onReminderChange(updated);
  };

  const getRemindersForEvent = (eventId: string) => {
    return activeReminders.filter((r) => r.eventId === eventId);
  };

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <XCircle className="w-5 h-5 text-red-600" />
        <span className="text-sm text-red-700 dark:text-red-300">
          Notifications blocked. Please enable in browser settings.
        </span>
      </div>
    );
  }

  if (permission === "default") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <Bell className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Enable Notifications
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Get reminders for your upcoming events
            </p>
          </div>
          <button
            onClick={requestPermission}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
          >
            Enable
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Active Reminders Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Notifications Enabled
          </span>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-xs text-blue-600 hover:text-blue-700"
        >
          {showSettings ? "Hide" : "Manage"} Reminders
        </button>
      </div>

      {/* Reminder Settings */}
      {showSettings && (
        <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Click to add reminders for events
          </p>
          
          {events.slice(0, 5).filter(Boolean).map((event) => {
            if (!event.id) return null;
            const eventReminders = getRemindersForEvent(event.id);
            return (
              <div key={event.id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {event.title}
                </div>
                <div className="flex flex-wrap gap-1">
                  {PRESET_REMINDERS.map((preset) => {
                    const hasReminder = eventReminders.some(
                      (r) => r.minutesBefore === preset.minutes
                    );
                    return (
                      <button
                        key={preset.minutes}
                        onClick={() =>
                          hasReminder
                            ? removeReminder(
                                eventReminders.find(
                                  (r) => r.minutesBefore === preset.minutes
                                )!.id
                              )
                            : addReminder(event.id!, preset.minutes)
                        }
                        disabled={!event.startTime || new Date(event.startTime).getTime() < Date.now()}
                        className={`
                          px-2 py-1 text-xs rounded-full transition-colors
                          ${hasReminder
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300"
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function useEventReminders(event: CalendarEvent) {
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);

  const addReminder = (minutes: number) => {
    if (!reminderMinutes.includes(minutes)) {
      setReminderMinutes([...reminderMinutes, minutes]);
    }
  };

  const removeReminder = (minutes: number) => {
    setReminderMinutes(reminderMinutes.filter((m) => m !== minutes));
  };

  const isUpcoming = (): boolean => {
    if (!event.startTime) return false;
    const now = Date.now();
    const eventStart = new Date(event.startTime).getTime();
    if (isNaN(eventStart)) return false;
    const minutesUntilEvent = differenceInMinutes(eventStart, now);
    
    const nextReminder = reminderMinutes.sort((a, b) => b - a)[0];
    return minutesUntilEvent > 0 && minutesUntilEvent <= nextReminder;
  };

  return {
    reminderMinutes,
    addReminder,
    removeReminder,
    isUpcoming,
  };
}

export function NotificationToast({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Upcoming Event
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              {event.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Starting at {event.startTime && !isNaN(new Date(event.startTime).getTime()) 
                ? format(new Date(event.startTime), "h:mm a") 
                : "TBD"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <XCircle className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Dismiss
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            View Event
          </button>
        </div>
      </div>
    </div>
  );
}
