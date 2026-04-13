"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import type { CalendarEvent, Calendar } from "@/src/domain/calendar/event";
import { DEFAULT_CALENDARS } from "@/src/domain/calendar/event";
import { loadEvents, saveEvents } from "@/src/infrastructure/storage/encryptedStorage";
import { enqueueOperation, processQueue, forceSyncNow, getQueueStatus, isSyncing } from "@/src/infrastructure/sync/syncEngine";

const CALENDARS_KEY = "vancal-calendars";

export interface UseEventsResult {
  events: CalendarEvent[];
  calendars: Calendar[];
  setCalendars: (calendars: Calendar[]) => void;
  toggleCalendar: (calendarId: string) => void;
  filteredEvents: CalendarEvent[];
  createEvent: (event: Omit<CalendarEvent, "id" | "version" | "updatedAt" | "deleted">) => Promise<void>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  toggleTask: (eventId: string) => Promise<void>;
  isLoaded: boolean;
  syncStatus: "idle" | "syncing" | "error" | "offline";
  pendingCount: number;
  forceSync: () => Promise<void>;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendarsState] = useState<Calendar[]>(DEFAULT_CALENDARS);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const storedCalendars = localStorage.getItem(CALENDARS_KEY);
        if (storedCalendars) {
          setCalendarsState(JSON.parse(storedCalendars));
        }

        const loadedEvents = await loadEvents();
        setEvents(loadedEvents);
        setIsLoaded(true);
      } catch (error) {
        console.error("Failed to load events:", error);
        setIsLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updateStatus = async () => {
      const status = await getQueueStatus();
      setPendingCount(status.pending);
      setSyncing(isSyncing());
    };

    const processSyncInBackground = async () => {
      try {
        await processQueue();
      } catch (error) {
        console.error("Background sync failed:", error);
      }
    };

    updateStatus();
    
    processSyncInBackground();
    
    const interval = setInterval(() => {
      updateStatus();
      processSyncInBackground();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const setCalendars = useCallback((newCalendars: Calendar[]) => {
    setCalendarsState(newCalendars);
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(newCalendars));
  }, []);

  const toggleCalendar = useCallback((calendarId: string) => {
    setCalendarsState(prev => 
      prev.map(cal => 
        cal.id === calendarId ? { ...cal, visible: !cal.visible } : cal
      )
    );
  }, []);

  useEffect(() => {
    localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
  }, [calendars]);

  const filteredEvents = useMemo(() => {
    const visibleIds = calendars.filter(c => c.visible).map(c => c.id);
    return events.filter(e => 
      visibleIds.includes(e.calendarId || "personal") && 
      !e.deleted
    );
  }, [events, calendars]);

  const createEvent = useCallback(async (eventData: Omit<CalendarEvent, "id" | "version" | "updatedAt" | "deleted">) => {
    const now = Date.now();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${now}-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      updatedAt: now,
      deleted: false,
    };

    setEvents(prev => {
      const updated = [...prev, newEvent];
      saveEvents(updated);
      return updated;
    });

    enqueueOperation("create", newEvent.id, newEvent, 1);
  }, [setEvents]);

  const updateEvent = useCallback(async (eventId: string, updates: Partial<CalendarEvent>) => {
    let newVersion = 1;
    let eventToSync: CalendarEvent | null = null;
    
    setEvents(prev => {
      const event = prev.find(e => e.id === eventId);
      if (!event) return prev;
      
      newVersion = (event.version || 1) + 1;
      eventToSync = { ...event, ...updates, version: newVersion, updatedAt: Date.now() };
      
      const updated = prev.map(e => {
        if (e.id !== eventId) return e;
        return eventToSync as CalendarEvent;
      });
      saveEvents(updated);
      return updated;
    });

    if (eventToSync) {
      enqueueOperation("update", eventId, eventToSync, newVersion);
    }
  }, []);

  const deleteEvent = useCallback(async (eventId: string) => {
    setEvents(prev => {
      const event = prev.find(e => e.id === eventId);
      if (!event) return prev;
      
      const newVersion = (event.version || 1) + 1;
      
      const updated = prev.map(e => 
        e.id === eventId 
          ? { ...e, deleted: true, version: newVersion, updatedAt: Date.now() }
          : e
      );
      saveEvents(updated.filter(e => !e.deleted));
      return updated.filter(e => !e.deleted);
    });

    enqueueOperation("delete", eventId, null, 0);
  }, []);

  const toggleTask = useCallback(async (eventId: string) => {
    let newVersion = 1;
    let eventToSync: CalendarEvent | null = null;
    
    setEvents(prev => {
      const event = prev.find(e => e.id === eventId);
      if (!event) return prev;
      
      newVersion = (event.version || 1) + 1;
      const newCompleted = !event.completed;
      eventToSync = { ...event, completed: newCompleted, version: newVersion, updatedAt: Date.now() };
      
      const updated = prev.map(e => {
        if (e.id !== eventId) return e;
        return eventToSync as CalendarEvent;
      });
      saveEvents(updated);
      return updated;
    });
    
    if (eventToSync) {
      enqueueOperation("update", eventId, eventToSync, newVersion);
    }
  }, []);

  const forceSync = useCallback(async () => {
    await forceSyncNow();
    const status = await getQueueStatus();
    setPendingCount(status.pending);
  }, []);

  const syncStatus = useMemo((): "idle" | "syncing" | "error" | "offline" => {
    if (syncing) return "syncing";
    if (pendingCount > 0) return "error";
    return "idle";
  }, [syncing, pendingCount]);

  return {
    events: filteredEvents,
    calendars,
    setCalendars,
    toggleCalendar,
    filteredEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleTask,
    isLoaded,
    syncStatus,
    pendingCount,
    forceSync,
  };
}