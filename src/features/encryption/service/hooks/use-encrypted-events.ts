"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { encryptData, decryptData, hasMasterKey } from "../e2ee";
import type { EncryptedPayload } from "../../model/types";

export interface EventData {
  _id?: Id<"events">;
  _creationTime?: number;
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
  createdAt?: number;
  updatedAt?: number;
}

interface EncryptedEventDoc {
  _id: Id<"events">;
  _creationTime: number;
  userId: string;
  encryptedPayload: string;
  createdAt: number;
  updatedAt: number;
}

export function useEncryptedEvents(userId?: string | null) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const encryptedEvents = useQuery(api.events.index.getEvents, userId ? { userId } : "skip");
  const createEncryptedEvent = useMutation(api.events.index.createEvent);
  const updateEncryptedEvent = useMutation(api.events.index.updateEvent);
  const deleteEncryptedEvent = useMutation(api.events.index.deleteEvent);

  const decryptEvent = useCallback(async (encrypted: EncryptedEventDoc): Promise<EventData | null> => {
    if (!hasMasterKey()) {
      return null;
    }
    try {
      const payload: EncryptedPayload = JSON.parse(encrypted.encryptedPayload);
      const decrypted = await decryptData<EventData>(payload);
      return {
        ...decrypted,
        _id: encrypted._id,
        _creationTime: encrypted._creationTime,
        createdAt: encrypted.createdAt,
        updatedAt: encrypted.updatedAt,
      };
    } catch (err) {
      console.error("Failed to decrypt event:", encrypted._id, err);
      return null;
    }
  }, []);

  const decryptAllEvents = useCallback(async () => {
    if (!encryptedEvents || !hasMasterKey()) {
      setEvents([]);
      return;
    }

    setIsDecrypting(true);
    setError(null);

    try {
      const decryptedEvents: EventData[] = [];
      for (const event of encryptedEvents) {
        const decrypted = await decryptEvent(event);
        if (decrypted) {
          decryptedEvents.push(decrypted);
        }
      }
      setEvents(decryptedEvents);
    } catch (err) {
      setError("Failed to decrypt events");
      console.error(err);
    } finally {
      setIsDecrypting(false);
    }
  }, [encryptedEvents, decryptEvent]);

  useEffect(() => {
    decryptAllEvents();
  }, [encryptedEvents, decryptAllEvents]);

  const createEvent = useCallback(async (eventData: Omit<EventData, "_id" | "_creationTime" | "createdAt" | "updatedAt">) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available. Please unlock the app first.");
    }

    const { _id, _creationTime, createdAt, updatedAt, ...data } = eventData as EventData;
    const encrypted = await encryptData(data);
    
    return createEncryptedEvent({
      userId: data.userId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, [createEncryptedEvent]);

  const updateEvent = useCallback(async (eventId: Id<"events">, eventData: Partial<EventData>) => {
    if (!hasMasterKey()) {
      throw new Error("Encryption key not available. Please unlock the app first.");
    }

    const { _id, _creationTime, userId, createdAt, updatedAt, ...data } = eventData as EventData;
    const encrypted = await encryptData(data);
    
    return updateEncryptedEvent({
      eventId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, [updateEncryptedEvent]);

  const deleteEvent = useCallback(async (eventId: Id<"events">) => {
    return deleteEncryptedEvent({ eventId });
  }, [deleteEncryptedEvent]);

  const refresh = useCallback(() => {
    decryptAllEvents();
  }, [decryptAllEvents]);

  return {
    events,
    isDecrypting,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh,
  };
}