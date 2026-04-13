"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { encryptData, decryptData, hasMasterKey, type EncryptedPayload } from "@/lib/e2ee";
import type { CalendarEvent } from "@/lib/types";

export interface NotificationEvent {
  id: string;
  title: string;
  seen: boolean;
  timestamp: number;
  type: "overdue" | "reflection" | "suggestion" | "system";
}

const STORAGE_KEY = "calendar-notifications";
const PENDING_SYNC_KEY = "pending-sync";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const processedRef = useRef<Set<string>>(new Set());

  const loadNotifications = useCallback(async () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          if (hasMasterKey()) {
            const encrypted: EncryptedPayload = JSON.parse(raw);
            const decrypted = await decryptData(encrypted);
            setNotifications(decrypted as NotificationEvent[]);
          } else {
            const parsed = JSON.parse(raw);
            setNotifications(parsed as NotificationEvent[]);
          }
        } catch {
          const parsed = JSON.parse(raw);
          setNotifications(parsed as NotificationEvent[]);
        }
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
      setNotifications([]);
    }
  }, []);

  const saveNotifications = useCallback(async (newNotifications: NotificationEvent[]) => {
    try {
      if (hasMasterKey()) {
        const encrypted = await encryptData(newNotifications);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));

        const pendingRaw = localStorage.getItem(PENDING_SYNC_KEY);
        const pendingQueue = pendingRaw ? JSON.parse(pendingRaw) : [];
        pendingQueue.push({ type: "notifications", data: encrypted, timestamp: Date.now() });
        localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pendingQueue));
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newNotifications));
      }

      setNotifications(newNotifications);
    } catch (e) {
      console.error("Failed to save notifications:", e);
    }
  }, []);

  const addNotification = useCallback(async (title: string, type: NotificationEvent["type"] = "system") => {
    const newNotif: NotificationEvent = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title,
      seen: false,
      timestamp: Date.now(),
      type,
    };
    const updated = [newNotif, ...notifications].slice(0, 50);
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    const updated = notifications.map((n) => 
      n.id === id ? { ...n, seen: true } : n
    );
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map((n) => ({ ...n, seen: true }));
    await saveNotifications(updated);
  }, [notifications, saveNotifications]);

  const clearNotifications = useCallback(async () => {
    await saveNotifications([]);
  }, [saveNotifications]);

  const checkOverdueTasks = useCallback(async (events: CalendarEvent[]) => {
    const now = new Date();
    const currentTime = now.getTime();

    for (const event of events) {
      if (event.type !== "task" || event.completed) continue;

      const eventTime = event.startTime || 0;

      if (eventTime < currentTime && !processedRef.current.has(event.id)) {
        processedRef.current.add(event.id);
        await addNotification(`Task "${event.title}" is overdue!`, "overdue");
      }
    }
  }, [addNotification]);

  const unreadCount = notifications.filter(n => !n.seen).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    checkOverdueTasks,
    loadNotifications,
  };
}
