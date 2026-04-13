/**
 * Metadata-Free Notification System
 * Privacy-preserving notifications that don't reveal event details
 * 
 * The server only sees:
 * - A notification should be sent at time T
 * - A category/type indicator (e.g., "reminder", "meeting")
 * - No event titles, descriptions, or participants
 * 
 * The client decrypts locally to show the actual notification
 */

import { arrayBufferToBase64, base64ToArrayBuffer } from "./e2ee";

export interface PrivacyNotification {
  id: string;
  calendarId: string;
  eventId: string;
  scheduledAt: number;
  triggeredAt?: number;
  category: NotificationCategory;
  urgency: NotificationUrgency;
  encryptionIv: string;
  encryptedPayload: string;
  payloadHash: string;
  status: "scheduled" | "sent" | "clicked" | "dismissed";
}

export type NotificationCategory =
  | "reminder"
  | "meeting"
  | "task"
  | "all-day"
  | "custom";

export type NotificationUrgency = "low" | "normal" | "high" | "critical";

export interface EncryptedNotificationPayload {
  title: string;
  body: string;
  location?: string;
  participants?: string[];
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationPreferences {
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart?: number;
  quietHoursEnd?: number;
  categories: Partial<Record<NotificationCategory, CategoryPreference>>;
}

export interface CategoryPreference {
  enabled: boolean;
  urgency: NotificationUrgency;
  sound: boolean;
  vibration: boolean;
  preview: boolean;
}

const PRIVACY_CATEGORIES: NotificationCategory[] = [
  "reminder",
  "meeting",
  "task",
  "all-day",
  "custom",
];

const ENCRYPTION_ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

const scheduledNotifications = new Map<string, PrivacyNotification>();
const notificationHistory: PrivacyNotification[] = [];

export function getDefaultPreferences(): NotificationPreferences {
  return {
    enablePush: true,
    enableEmail: false,
    enableSms: false,
    quietHoursEnabled: false,
    quietHoursStart: 22,
    quietHoursEnd: 8,
    categories: {
      reminder: { enabled: true, urgency: "normal", sound: true, vibration: true, preview: false },
      meeting: { enabled: true, urgency: "high", sound: true, vibration: true, preview: true },
      task: { enabled: true, urgency: "normal", sound: true, vibration: false, preview: true },
      "all-day": { enabled: true, urgency: "low", sound: false, vibration: false, preview: false },
      custom: { enabled: true, urgency: "normal", sound: true, vibration: true, preview: true },
    },
  };
}

export async function encryptNotificationPayload(
  payload: EncryptedNotificationPayload,
  key: CryptoKey
): Promise<{ encrypted: string; iv: string; hash: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const data = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    dataBytes
  );

  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);

  return {
    encrypted: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    hash: arrayBufferToBase64(hashBuffer),
  };
}

export async function decryptNotificationPayload(
  encrypted: string,
  iv: string,
  key: CryptoKey
): Promise<EncryptedNotificationPayload | null> {
  try {
    const encryptedData = base64ToArrayBuffer(encrypted);
    const ivData = base64ToArrayBuffer(iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: ivData },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    const data = decoder.decode(decrypted);
    return JSON.parse(data) as EncryptedNotificationPayload;
  } catch {
    return null;
  }
}

export async function schedulePrivacyNotification(
  calendarId: string,
  eventId: string,
  triggerAt: number,
  payload: EncryptedNotificationPayload,
  category: NotificationCategory,
  urgency: NotificationUrgency,
  encryptionKey: CryptoKey
): Promise<PrivacyNotification> {
  const { encrypted, iv, hash } = await encryptNotificationPayload(
    payload,
    encryptionKey
  );

  const notification: PrivacyNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    eventId,
    scheduledAt: triggerAt,
    category,
    urgency,
    encryptionIv: iv,
    encryptedPayload: encrypted,
    payloadHash: hash,
    status: "scheduled",
  };

  scheduledNotifications.set(notification.id, notification);
  return notification;
}

export function getScheduledNotification(
  id: string
): PrivacyNotification | null {
  return scheduledNotifications.get(id) || null;
}

export function getNotificationsForCalendar(
  calendarId: string
): PrivacyNotification[] {
  return Array.from(scheduledNotifications.values()).filter(
    (n) => n.calendarId === calendarId && n.status === "scheduled"
  );
}

export function cancelNotification(id: string): boolean {
  const notification = scheduledNotifications.get(id);
  if (!notification) return false;

  notification.status = "dismissed";
  notificationHistory.push(notification);
  scheduledNotifications.delete(id);
  return true;
}

export function markNotificationClicked(id: string): boolean {
  const notification = scheduledNotifications.get(id);
  if (!notification) return false;

  notification.status = "clicked";
  notification.triggeredAt = Date.now();
  notificationHistory.push(notification);
  scheduledNotifications.delete(id);
  return true;
}

export function markNotificationDismissed(id: string): boolean {
  const notification = scheduledNotifications.get(id);
  if (!notification) return false;

  notification.status = "dismissed";
  notification.triggeredAt = Date.now();
  notificationHistory.push(notification);
  scheduledNotifications.delete(id);
  return true;
}

export function getNotificationHistory(
  calendarId?: string,
  limit = 50
): PrivacyNotification[] {
  const history = calendarId
    ? notificationHistory.filter((n) => n.calendarId === calendarId)
    : notificationHistory;
  return history.slice(-limit).reverse();
}

export function getDueNotifications(): PrivacyNotification[] {
  const now = Date.now();
  return Array.from(scheduledNotifications.values())
    .filter((n) => n.status === "scheduled" && n.scheduledAt <= now)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);
}

export function shouldShowNotification(
  preferences: NotificationPreferences,
  category: NotificationCategory
): boolean {
  const catPref = preferences.categories[category];
  if (!catPref?.enabled) return false;

  if (preferences.quietHoursEnabled) {
    const now = new Date();
    const currentHour = now.getHours();
    const start = preferences.quietHoursStart || 22;
    const end = preferences.quietHoursEnd || 8;

    if (start > end) {
      if (currentHour >= start || currentHour < end) return false;
    } else {
      if (currentHour >= start && currentHour < end) return false;
    }
  }

  return true;
}

export function getCategoryDisplayName(category: NotificationCategory): string {
  const names: Record<NotificationCategory, string> = {
    reminder: "Reminder",
    meeting: "Meeting",
    task: "Task",
    "all-day": "All-day Event",
    custom: "Event",
  };
  return names[category];
}

export function getCategoryIcon(category: NotificationCategory): string {
  const icons: Record<NotificationCategory, string> = {
    reminder: "bell",
    meeting: "users",
    task: "check-square",
    "all-day": "calendar",
    custom: "calendar",
  };
  return icons[category];
}

export function calculateNotificationTime(
  eventStart: number,
  minutesBefore: number
): number {
  return eventStart - minutesBefore * 60 * 1000;
}

export function generateGenericNotificationBody(
  category: NotificationCategory,
  urgency: NotificationUrgency
): string {
  const bodies: Record<NotificationCategory, Record<NotificationUrgency, string>> = {
    reminder: {
      low: "You have an upcoming reminder",
      normal: "Reminder: Upcoming event",
      high: "Important reminder",
      critical: "Urgent reminder",
    },
    meeting: {
      low: "Meeting starting soon",
      normal: "Meeting starting soon",
      high: "Meeting starting in 15 minutes",
      critical: "Meeting starting now",
    },
    task: {
      low: "Task due soon",
      normal: "Task deadline approaching",
      high: "Task due soon",
      critical: "Task overdue",
    },
    "all-day": {
      low: "All-day event today",
      normal: "You have an event today",
      high: "Event today",
      critical: "Event today",
    },
    custom: {
      low: "Event coming up",
      normal: "Upcoming event",
      high: "Event starting soon",
      critical: "Event starting now",
    },
  };

  return bodies[category][urgency];
}

export async function createBlanketNotification(
  eventStart: number,
  minutesBefore: number,
  category: NotificationCategory,
  urgency: NotificationUrgency
): Promise<{ triggerAt: number; category: NotificationCategory; urgency: NotificationUrgency }> {
  return {
    triggerAt: calculateNotificationTime(eventStart, minutesBefore),
    category,
    urgency,
  };
}

export function validateNotificationTime(
  scheduledAt: number
): { valid: boolean; reason?: string } {
  const now = Date.now();
  const minAdvance = 60 * 1000;
  const maxAdvance = 365 * 24 * 60 * 60 * 1000;

  if (scheduledAt < now + minAdvance) {
    return { valid: false, reason: "Notification must be at least 1 minute in the future" };
  }

  if (scheduledAt > now + maxAdvance) {
    return { valid: false, reason: "Cannot schedule more than 1 year in advance" };
  }

  return { valid: true };
}