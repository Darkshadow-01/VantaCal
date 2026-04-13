"use client";

import { useState, useCallback, useEffect } from "react";
import {
  type PrivacyNotification,
  type NotificationPreferences,
  type NotificationCategory,
  type NotificationUrgency,
  type EncryptedNotificationPayload,
  getDefaultPreferences,
  schedulePrivacyNotification,
  cancelNotification,
  markNotificationClicked,
  markNotificationDismissed,
  getDueNotifications,
  getNotificationsForCalendar,
  getNotificationHistory,
  shouldShowNotification,
  validateNotificationTime,
} from "@/lib/metadata-free-notifications";

export interface UsePrivacyNotificationsReturn {
  preferences: NotificationPreferences;
  scheduledNotifications: PrivacyNotification[];
  notificationHistory: PrivacyNotification[];
  isLoading: boolean;
  error: string | null;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  schedule: (
    calendarId: string,
    eventId: string,
    triggerAt: number,
    payload: EncryptedNotificationPayload,
    category: NotificationCategory,
    urgency: NotificationUrgency,
    encryptionKey: CryptoKey
  ) => Promise<PrivacyNotification | null>;
  cancel: (id: string) => void;
  markClicked: (id: string) => void;
  markDismissed: (id: string) => void;
  getDueNow: () => PrivacyNotification[];
  canShow: (category: NotificationCategory) => boolean;
  getCalendarNotifications: (calendarId: string) => PrivacyNotification[];
}

export function usePrivacyNotifications(
  encryptionKey: CryptoKey,
  initialPreferences?: Partial<NotificationPreferences>,
  calendarId?: string
): UsePrivacyNotificationsReturn {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    ...getDefaultPreferences(),
    ...initialPreferences,
  }));

  const [scheduledNotifications, setScheduledNotifications] = useState<
    PrivacyNotification[]
  >([]);
  const [notificationHistory, setNotificationHistory] = useState<
    PrivacyNotification[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (calendarId) {
      const scheduled = getNotificationsForCalendar(calendarId);
      setScheduledNotifications(scheduled);

      const history = getNotificationHistory(calendarId);
      setNotificationHistory(history);
    }
  }, [calendarId]);

  const updatePreferences = useCallback(
    (prefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...prefs }));
    },
    []
  );

  const schedule = useCallback(
    async (
      calendarId: string,
      eventId: string,
      triggerAt: number,
      payload: EncryptedNotificationPayload,
      category: NotificationCategory,
      urgency: NotificationUrgency,
      key: CryptoKey
    ): Promise<PrivacyNotification | null> => {
      setIsLoading(true);
      setError(null);

      const validation = validateNotificationTime(triggerAt);
      if (!validation.valid) {
        setError(validation.reason || "Invalid notification time");
        setIsLoading(false);
        return null;
      }

      try {
        const notification = await schedulePrivacyNotification(
          calendarId,
          eventId,
          triggerAt,
          payload,
          category,
          urgency,
          key
        );

        setScheduledNotifications((prev) => [...prev, notification]);
        return notification;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to schedule notification");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const cancel = useCallback((id: string) => {
    cancelNotification(id);
    setScheduledNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const markClicked = useCallback((id: string) => {
    markNotificationClicked(id);
    setScheduledNotifications((prev) => prev.filter((n) => n.id !== id));
    if (calendarId) {
      setNotificationHistory((prev) => [
        ...prev,
        ...getNotificationHistory(calendarId).slice(-1),
      ]);
    }
  }, [calendarId]);

  const markDismissed = useCallback((id: string) => {
    markNotificationDismissed(id);
    setScheduledNotifications((prev) => prev.filter((n) => n.id !== id));
    if (calendarId) {
      setNotificationHistory((prev) => [
        ...prev,
        ...getNotificationHistory(calendarId).slice(-1),
      ]);
    }
  }, [calendarId]);

  const getDueNow = useCallback((): PrivacyNotification[] => {
    return getDueNotifications();
  }, []);

  const canShow = useCallback(
    (category: NotificationCategory): boolean => {
      return shouldShowNotification(preferences, category);
    },
    [preferences]
  );

  const getCalendarNotifications = useCallback(
    (cid: string): PrivacyNotification[] => {
      return getNotificationsForCalendar(cid);
    },
    []
  );

  return {
    preferences,
    scheduledNotifications,
    notificationHistory,
    isLoading,
    error,
    updatePreferences,
    schedule,
    cancel,
    markClicked,
    markDismissed,
    getDueNow,
    canShow,
    getCalendarNotifications,
  };
}

export interface EventReminderConfig {
  minutesBefore: number;
  enabled: boolean;
  customUrgency?: NotificationUrgency;
}

export interface UseEventRemindersReturn {
  createReminderForEvent: (
    eventId: string,
    eventStart: number,
    eventTitle: string,
    eventLocation?: string,
    eventColor?: string
  ) => Promise<PrivacyNotification | null>;
  removeReminderForEvent: (eventId: string) => void;
  getRemindersForEvent: (eventId: string) => PrivacyNotification[];
}

export function useEventReminders(
  calendarId: string,
  encryptionKey: CryptoKey,
  defaultReminders: EventReminderConfig[] = [
    { minutesBefore: 15, enabled: true, customUrgency: "normal" },
    { minutesBefore: 60, enabled: true, customUrgency: "low" },
  ]
): UseEventRemindersReturn {
  const [reminderMap, setReminderMap] = useState<
    Map<string, PrivacyNotification[]>
  >(new Map());

  const createReminderForEvent = useCallback(
    async (
      eventId: string,
      eventStart: number,
      eventTitle: string,
      eventLocation?: string,
      eventColor?: string
    ): Promise<PrivacyNotification | null> => {
      for (const config of defaultReminders) {
        if (!config.enabled) continue;

        const payload: EncryptedNotificationPayload = {
          title: eventTitle,
          body: `Starting in ${config.minutesBefore} minutes`,
          location: eventLocation,
          metadata: { eventId, minutesBefore: config.minutesBefore },
        };

        try {
          const notification = await schedulePrivacyNotification(
            calendarId,
            eventId,
            eventStart - config.minutesBefore * 60 * 1000,
            payload,
            "reminder",
            config.customUrgency || "normal",
            encryptionKey
          );

          setReminderMap((prev) => {
            const newMap = new Map(prev);
            const existing = newMap.get(eventId) || [];
            newMap.set(eventId, [...existing, notification]);
            return newMap;
          });

          return notification;
        } catch {
          console.error("Failed to create reminder");
        }
      }
      return null;
    },
    [calendarId, defaultReminders, encryptionKey]
  );

  const removeReminderForEvent = useCallback((eventId: string) => {
    setReminderMap((prev) => {
      const reminders = prev.get(eventId) || [];
      for (const reminder of reminders) {
        cancelNotification(reminder.id);
      }
      const newMap = new Map(prev);
      newMap.delete(eventId);
      return newMap;
    });
  }, []);

  const getRemindersForEvent = useCallback(
    (eventId: string): PrivacyNotification[] => {
      return reminderMap.get(eventId) || [];
    },
    [reminderMap]
  );

  return {
    createReminderForEvent,
    removeReminderForEvent,
    getRemindersForEvent,
  };
}