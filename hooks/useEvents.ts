"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types";
import { offlineStorage } from "@/lib/offline-storage";

export interface EventInput {
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
  allDay?: boolean;
  calendarId?: string;
  color?: string;
  type?: string;
  system?: "Health" | "Work" | "Relationships";
  location?: string;
  reminder?: number;
}

export interface UseEventsReturn {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
  addEvent: (event: EventInput) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  createEvent: (event: EventInput) => Promise<void>;
  syncStatus: "idle" | "synced" | "pending" | "error" | "syncing";
  forceSync: () => Promise<void>;
}

export function useEvents(): UseEventsReturn {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "synced" | "pending" | "error" | "syncing">("idle");

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await offlineStorage.getAllEvents();
      setEvents(stored);
      setError(null);
    } catch (err) {
      setError("Failed to load events");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const addEvent = useCallback(async (event: EventInput) => {
    try {
      const now = Date.now();
      const newEvent: CalendarEvent = {
        title: event.title,
        description: event.description,
        startTime: event.startTime,
        endTime: event.endTime,
        allDay: event.allDay ?? false,
        calendarId: event.calendarId ?? "personal",
        color: event.color ?? "#4F8DFD",
        type: event.type ?? "event",
        system: event.system,
        location: event.location,
        reminder: event.reminder,
        id: `event-${now}-${Math.random().toString(36).substr(2, 9)}`,
        version: 1,
        updatedAt: now,
      } as CalendarEvent;
      await offlineStorage.saveEvent(newEvent);
      await loadEvents();
    } catch (err) {
      setError("Failed to add event");
      console.error(err);
    }
  }, [loadEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const event = events.find(e => e.id === id);
      if (!event) return;
      const updatedEvent: CalendarEvent = {
        ...event,
        ...updates,
        id,
        updatedAt: Date.now(),
      };
      await offlineStorage.saveEvent(updatedEvent);
      await loadEvents();
    } catch (err) {
      setError("Failed to update event");
      console.error(err);
    }
  }, [events, loadEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await offlineStorage.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      setError("Failed to delete event");
      console.error(err);
    }
  }, [loadEvents]);

  const forceSync = useCallback(async () => {
    setSyncStatus("pending");
    try {
      await loadEvents();
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }, [loadEvents]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refresh: loadEvents,
    createEvent: addEvent,
    syncStatus,
    forceSync,
  };
}