"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { CalendarEvent, DayReflection, TrendSummary } from "@/lib/types";
import { encryptData, decryptData, hasMasterKey, type EncryptedPayload } from "@/lib/e2ee";

const ENCRYPTED_EVENTS_KEY = "calendar-events-encrypted";
const REFLECTION_KEY = "calendar-reflections";
const PENDING_SYNC_KEY = "pending-sync";

export function useEventSync() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [reflections, setReflections] = useState<DayReflection[]>([]);
  const [isEncrypted, setIsEncrypted] = useState(false);

  const loadEncryptedData = useCallback(async (key: string): Promise<any[] | null> => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      
      if (hasMasterKey()) {
        const encrypted: EncryptedPayload = JSON.parse(stored);
        const decrypted = await decryptData(encrypted);
        return decrypted as any[];
      } else {
        return JSON.parse(stored);
      }
    } catch {
      return null;
    }
  }, []);

  const saveEncryptedData = useCallback(async (key: string, data: any[]): Promise<void> => {
    try {
      if (hasMasterKey()) {
        const encrypted = await encryptData(data);
        localStorage.setItem(key, JSON.stringify(encrypted));
        setIsEncrypted(true);
      } else {
        localStorage.setItem(key, JSON.stringify(data));
        setIsEncrypted(false);
      }
    } catch (error) {
      console.error("Failed to save encrypted data:", error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = localStorage.getItem(ENCRYPTED_EVENTS_KEY);
        if (stored) {
          try {
            if (hasMasterKey()) {
              const encrypted: EncryptedPayload = JSON.parse(stored);
              const decrypted = await decryptData(encrypted);
              setEvents(decrypted as CalendarEvent[]);
              setIsEncrypted(true);
            } else {
              const parsed = JSON.parse(stored);
              setEvents(parsed as CalendarEvent[]);
              setIsEncrypted(false);
            }
          } catch {
            const parsed = JSON.parse(stored);
            setEvents(parsed as CalendarEvent[]);
            setIsEncrypted(false);
          }
        } else {
          const fallback = localStorage.getItem("calendar-events");
          if (fallback) {
            setEvents(JSON.parse(fallback) as CalendarEvent[]);
          }
        }

        const reflectionStored = localStorage.getItem(REFLECTION_KEY);
        if (reflectionStored) {
          setReflections(JSON.parse(reflectionStored) as DayReflection[]);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, []);

  const syncToPendingQueue = useCallback((updatedEvents: CalendarEvent[]) => {
    try {
      const pending = {
        events: updatedEvents,
        timestamp: Date.now(),
      };
      localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
      console.log("Syncing events with backend… (placeholder)", pending);
    } catch (error) {
      console.error("Failed to sync:", error);
    }
  }, []);

  const saveEvents = useCallback(async (updated: CalendarEvent[]) => {
    setEvents(updated);
    await saveEncryptedData(ENCRYPTED_EVENTS_KEY, updated);
    syncToPendingQueue(updated);
  }, [saveEncryptedData, syncToPendingQueue]);

  const syncEvents = useCallback(() => {
    try {
      const pending = localStorage.getItem(PENDING_SYNC_KEY);
      if (pending) {
        const data = JSON.parse(pending);
        console.log("Syncing events with backend… (placeholder)", data);
      }
    } catch (error) {
      console.error("Failed to sync events:", error);
    }
  }, []);

  const toggleTaskCompletion = useCallback(async (eventId: string) => {
    const updated = events.map(e => 
      e.id === eventId ? { ...e, completed: !e.completed } : e
    );
    await saveEvents(updated);
  }, [events, saveEvents]);

  const updateEventTitle = useCallback(async (eventId: string, title: string) => {
    const updated = events.map(e => 
      e.id === eventId ? { ...e, title } : e
    );
    await saveEvents(updated);
  }, [events, saveEvents]);

  const saveReflectionNote = useCallback(async (note: Omit<DayReflection, "timestamp">) => {
    const updated: DayReflection[] = [...reflections, { ...note, timestamp: Date.now() }].slice(-30);
    setReflections(updated);
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(updated));
    syncToPendingQueue(events);
  }, [reflections, events, syncToPendingQueue]);

  const trend = useMemo((): TrendSummary | null => {
    if (events.length === 0) return null;
    
    const now = new Date();
    const last7 = new Date(now);
    last7.setDate(now.getDate() - 7);
    
    const last7Days = events.filter(e => {
      if (!e.startTime) return false;
      const eventDate = new Date(e.startTime);
      return eventDate >= last7 && eventDate <= now;
    });

    const completed = last7Days.filter(e => e.completed).length;
    const health = last7Days.filter(e => e.calendarId === "tasks").length;
    const work = last7Days.filter(e => e.calendarId === "personal" && e.type !== "task").length;
    const relations = last7Days.filter(e => e.calendarId === "birthdays").length;

    return {
      last7DaysCompletion: last7Days.length > 0 ? Math.round((completed / last7Days.length) * 100) : 0,
      last7DaysHealthTasks: health,
      last7DaysWorkload: work,
      last7DaysRelations: relations,
    };
  }, [events]);

  return {
    events,
    setEvents: saveEvents,
    toggleTaskCompletion,
    updateEventTitle,
    saveReflectionNote,
    reflections,
    trend,
    syncEvents,
    isEncrypted,
  };
}
