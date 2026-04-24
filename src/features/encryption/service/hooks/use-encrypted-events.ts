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

interface LocalEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime?: number;
  allDay: boolean;
  calendarId: string;
  color: string;
  type: string;
  system?: "Health" | "Work" | "Relationships";
  location?: string;
  synced?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface PrivacyState {
  isEncrypted: boolean;
  isOffline: boolean;
  syncStatus: "synced" | "pending" | "error";
  lastSync: number | null;
  storageUsage: { used: number; percentage: number };
}

export function useEncryptedEvents(userId?: string | null) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const docs = useQuery(api.events.index.getEvents, userId ? { userId } : "skip") as EncryptedEventDoc[] | undefined;

  useEffect(() => {
    if (!docs) {
      setLoading(false);
      return;
    }

    const loadEvents = async () => {
      setLoading(true);
      try {
        if (!hasMasterKey()) {
          setError("Master key not set");
          setLoading(false);
          return;
        }

        const decrypted = await Promise.all(
          docs.map(async (doc) => {
            try {
              const payload = JSON.parse(doc.encryptedPayload) as EncryptedPayload;
              return await decryptData<EventData>(payload);
            } catch {
              return null;
            }
          })
        );

        setEvents(decrypted.filter((e): e is EventData => e !== null));
        setError(null);
      } catch (err) {
        setError("Failed to load events");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [docs]);

  const createEvent = useCallback(async (eventData: Omit<EventData, "_id" | "_creationTime" | "createdAt" | "updatedAt">) => {
    if (!hasMasterKey()) {
      throw new Error("Master key not set");
    }

    const create = useMutation(api.events.index.createEvent);
    const encrypted = await encryptData(eventData);

    await create({
      userId: eventData.userId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, []);

  const updateEvent = useCallback(async (eventId: Id<"events">, eventData: Partial<EventData>) => {
    if (!hasMasterKey()) {
      throw new Error("Master key not set");
    }

    const update = useMutation(api.events.index.updateEvent);
    const encrypted = await encryptData(eventData);

    await update({
      eventId,
      encryptedPayload: JSON.stringify(encrypted),
    });
  }, []);

  const deleteEvent = useCallback(async (eventId: Id<"events">) => {
    const remove = useMutation(api.events.index.deleteEvent);
    await remove({ eventId });
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    refresh: () => {},
  };
}

export function usePrivacyState() {
  const [state, setState] = useState<PrivacyState>({
    isEncrypted: true,
    isOffline: true,
    syncStatus: "synced",
    lastSync: null,
    storageUsage: { used: 0, percentage: 0 },
  });

  useEffect(() => {
    const update = () => {
      setState(prev => ({
        ...prev,
        isOffline: !navigator.onLine,
      }));
    };

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const enableEncryption = useCallback(async () => {
    setState(prev => ({ ...prev, isEncrypted: true }));
    return true;
  }, []);

  const disableEncryption = useCallback(() => {
    setState(prev => ({ ...prev, isEncrypted: false }));
  }, []);

  const clearData = useCallback(async () => {
    setState(prev => ({ ...prev, syncStatus: "pending" }));
  }, []);

  const sync = useCallback(async () => {
    setState(prev => ({ ...prev, syncStatus: "pending" }));
    await new Promise(resolve => setTimeout(resolve, 1000));
    setState(prev => ({
      ...prev,
      syncStatus: "synced",
      lastSync: Date.now(),
    }));
  }, []);

  return {
    ...state,
    enableEncryption,
    disableEncryption,
    clearData,
    sync,
  };
}

export function useOfflineSync() {
  const [pendingEvents, setPendingEvents] = useState<LocalEvent[]>([]);
  const [syncing, setSyncing] = useState(false);

  const checkPending = useCallback(async () => {
    setPendingEvents([]);
  }, []);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  const syncAll = useCallback(async (_remotePush: (events: LocalEvent[]) => Promise<void>) => {
    if (pendingEvents.length === 0) return;

    setSyncing(true);
    try {
      await checkPending();
    } finally {
      setSyncing(false);
    }
  }, [pendingEvents, checkPending]);

  return {
    pendingCount: pendingEvents.length,
    pendingEvents,
    syncing,
    syncAll,
    checkPending,
  };
}