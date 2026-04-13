"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  type PrivacyNotification,
  type NotificationPreferences,
  type NotificationCategory,
  type NotificationUrgency,
  type EncryptedNotificationPayload,
  schedulePrivacyNotification,
  cancelNotification,
  markNotificationClicked,
  markNotificationDismissed,
  getDueNotifications,
  getDefaultPreferences,
  decryptNotificationPayload,
  getNotificationsForCalendar,
  encryptNotificationPayload,
  shouldShowNotification,
  generateGenericNotificationBody,
  calculateNotificationTime,
  type CategoryPreference,
} from "@/lib/metadata-free-notifications";

interface NotificationContextValue {
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  scheduleNotification: (
    calendarId: string,
    eventId: string,
    startTime: number,
    minutesBefore: number,
    payload: EncryptedNotificationPayload,
    category: NotificationCategory,
    urgency: NotificationUrgency,
    encryptionKey: CryptoKey
  ) => Promise<PrivacyNotification>;
  cancelNotificationById: (id: string) => void;
  markAsClicked: (id: string) => void;
  markAsDismissed: (id: string) => void;
  getDue: () => PrivacyNotification[];
  decryptPayload: (
    notification: PrivacyNotification,
    key: CryptoKey
  ) => Promise<EncryptedNotificationPayload | null>;
  canShowCategory: (category: NotificationCategory) => boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null
);

export function useNotificationPrivacy(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationPrivacy must be used within NotificationPrivacyProvider"
    );
  }
  return context;
}

interface NotificationPrivacyProviderProps {
  children: ReactNode;
  encryptionKey: CryptoKey;
  initialPreferences?: Partial<NotificationPreferences>;
}

export function NotificationPrivacyProvider({
  children,
  encryptionKey,
  initialPreferences,
}: NotificationPrivacyProviderProps) {
  const [preferences, setPreferences] = useState<NotificationPreferences>(() => ({
    ...getDefaultPreferences(),
    ...initialPreferences,
  }));

  const updatePreferences = useCallback(
    (prefs: Partial<NotificationPreferences>) => {
      setPreferences((prev) => ({ ...prev, ...prefs }));
    },
    []
  );

  const scheduleNotification = useCallback(
    async (
      calendarId: string,
      eventId: string,
      startTime: number,
      minutesBefore: number,
      payload: EncryptedNotificationPayload,
      category: NotificationCategory,
      urgency: NotificationUrgency,
      key: CryptoKey
    ) => {
      const triggerAt = calculateNotificationTime(startTime, minutesBefore);
      return schedulePrivacyNotification(
        calendarId,
        eventId,
        triggerAt,
        payload,
        category,
        urgency,
        key
      );
    },
    []
  );

  const cancelNotificationById = useCallback((id: string) => {
    cancelNotification(id);
  }, []);

  const markAsClicked = useCallback((id: string) => {
    markNotificationClicked(id);
  }, []);

  const markAsDismissed = useCallback((id: string) => {
    markNotificationDismissed(id);
  }, []);

  const getDue = useCallback((): PrivacyNotification[] => {
    return getDueNotifications();
  }, []);

  const decryptPayload = useCallback(
    async (
      notification: PrivacyNotification,
      key: CryptoKey
    ): Promise<EncryptedNotificationPayload | null> => {
      return decryptNotificationPayload(
        notification.encryptedPayload,
        notification.encryptionIv,
        key
      );
    },
    []
  );

  const canShowCategory = useCallback(
    (category: NotificationCategory): boolean => {
      return shouldShowNotification(preferences, category);
    },
    [preferences]
  );

  useEffect(() => {
    if (!preferences.enablePush) return;

    const interval = setInterval(() => {
      const due = getDue();
      for (const notification of due) {
        if (shouldShowNotification(preferences, notification.category)) {
          new Notification("Calendar", {
            body: generateGenericNotificationBody(
              notification.category,
              notification.urgency
            ),
            icon: "/icon.png",
            tag: notification.id,
          });
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [preferences]);

  return (
    <NotificationContext.Provider
      value={{
        preferences,
        updatePreferences,
        scheduleNotification,
        cancelNotificationById,
        markAsClicked,
        markAsDismissed,
        getDue,
        decryptPayload,
        canShowCategory,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}