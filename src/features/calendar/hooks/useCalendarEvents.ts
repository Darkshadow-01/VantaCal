"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { encryptData, decryptData, hasMasterKey, type EncryptedPayload } from "@/features/encryption/service/e2ee";
import type { CalendarEvent, Calendar } from "@/features/calendar/model/types";
import { DEFAULT_CALENDARS } from "@/features/calendar/model/types";

const CALENDARS_KEY = "vancal-calendars";

export interface EventInput {
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}

interface EncryptedEventDoc {
  _id: Id<"events">;
  _creationTime: number;
  userId: string;
  encryptedPayload: string;
  createdAt: number;
  updatedAt: number;
}

function getInitialVisibility() {
  try {
    const saved = localStorage.getItem(CALENDARS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const visibility: Record<string, boolean> = {};
      parsed.forEach((cal: Calendar) => {
        visibility[cal.id] = cal.visible;
      });
      return visibility;
    }
  } catch { /* ignore */ }
  const defaultVisibility: Record<string, boolean> = {};
  DEFAULT_CALENDARS.forEach(cal => {
    defaultVisibility[cal.id] = cal.visible;
  });
  return defaultVisibility;
}

export function useCalendarEvents(userId?: string | null) {
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calendarVisibility, setCalendarVisibility] = useState<Record<string, boolean>>(() => getInitialVisibility());

  const encryptedEvents = useQuery(api.events.index.getEvents, userId ? { userId } : "skip");
  const createEncryptedEvent = useMutation(api.events.index.createEvent);
  const updateEncryptedEvent = useMutation(api.events.index.updateEvent);
  const deleteEncryptedEvent = useMutation(api.events.index.deleteEvent);

  useEffect(() => {
    // State is now initialized lazily - this just handles future updates if needed
  }, []);

  const decryptEvent = useCallback(async (encrypted: EncryptedEventDoc): Promise<CalendarEvent | null> => {
    if (!hasMasterKey()) {
      return null;
    }
    try {
      const payload: EncryptedPayload = JSON.parse(encrypted.encryptedPayload);
      const decrypted = await decryptData<EventInput>(payload);
      
      const startTime = decrypted.startTime;
      const now = Date.now();
      return {
        id: encrypted._id || `temp-${Date.now()}`,
        title: decrypted.title,
        startTime,
        endTime: decrypted.endTime,
        allDay: decrypted.allDay || false,
        calendarId: "personal",
        color: decrypted.color || "#4F8DFD",
        type: (decrypted.system?.toLowerCase() as CalendarEvent["type"]) || "event",
        system: decrypted.system,
        completed: false,
        description: decrypted.description,
        location: decrypted.location,
        version: 1,
        updatedAt: now,
      };
    } catch (err) {
      console.error("Failed to decrypt event:", encrypted._id, err);
      return null;
    }
  }, []);

  const events: CalendarEvent[] = useMemo(() => {
    if (!encryptedEvents || encryptedEvents.length === 0) {
      return [];
    }
    // For now, return empty during loading - decrypting happens in effect
    return [];
  }, [encryptedEvents]);

  const decryptedEvents = useMemo(() => {
    if (!encryptedEvents) return [];
    
    return encryptedEvents
      .map((e) => {
        try {
          const payload: EncryptedPayload = JSON.parse(e.encryptedPayload);
          // Note: This is sync for memo - actual decryption should be async
          // For now, we'll handle this differently
          return { doc: e, payload };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as { doc: EncryptedEventDoc; payload: EncryptedPayload }[];
  }, [encryptedEvents]);

  const createEvent = useCallback(async (eventData: EventInput) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available. Please unlock the app first.");
    }

    const encrypted = await encryptData(eventData);
    
    return createEncryptedEvent({
      userId: eventData.userId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, [createEncryptedEvent]);

  const updateEvent = useCallback(async (eventId: Id<"events">, eventData: Partial<EventInput>) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available. Please unlock the app first.");
    }

    const encrypted = await encryptData(eventData);
    
    return updateEncryptedEvent({
      eventId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, [updateEncryptedEvent]);

  const deleteEvent = useCallback(async (eventId: Id<"events">) => {
    return deleteEncryptedEvent({ eventId });
  }, [deleteEncryptedEvent]);

  const toggleCalendar = useCallback((calendarId: string) => {
    setCalendarVisibility(prev => {
      const updated = { ...prev, [calendarId]: !prev[calendarId] };
      // Save to localStorage
      const calendars = DEFAULT_CALENDARS.map(cal => ({
        ...cal,
        visible: updated[cal.id] ?? cal.visible,
      }));
      localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
      return updated;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      calendarVisibility[e.calendarId] !== false
    );
  }, [events, calendarVisibility]);

  return {
    events,
    decryptedEvents,
    isDecrypting,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    toggleCalendar,
    calendarVisibility,
    filteredEvents,
    refresh: () => {},
    isLoaded: !isDecrypting && !!encryptedEvents,
  };
}
