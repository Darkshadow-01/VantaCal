/**
 * Encrypted hooks for AI memory integration
 * Combines privacy features with agent memory
 */

import { useState, useEffect, useCallback } from "react";
import { encryptedLocalStorage as localStorage, type LocalEvent } from "./localStorage";
import { encrypt, decrypt, isEncryptionAvailable } from "./encryption";

export interface EncryptedMemory {
  id: string;
  userId: string;
  type: "episodic" | "semantic" | "procedural";
  category: string;
  content: string;
  encryptedContent: string;
  importance: number;
  createdAt: number;
  accessedAt: number;
  synced: boolean;
}

export interface PrivacyState {
  isEncrypted: boolean;
  isOffline: boolean;
  syncStatus: "synced" | "pending" | "error";
  lastSync: number | null;
  storageUsage: { used: number; percentage: number };
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
        storageUsage: localStorage.getStorageUsage(),
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
    const success = await localStorage.enableEncryption();
    if (success) {
      setState(prev => ({ ...prev, isEncrypted: true }));
    }
    return success;
  }, []);

  const disableEncryption = useCallback(() => {
    localStorage.disableEncryption();
    setState(prev => ({ ...prev, isEncrypted: false }));
  }, []);

  const clearData = useCallback(async () => {
    await localStorage.clearAll();
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

export function useEncryptedEvents() {
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await localStorage.getEvents();
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

  const addEvent = useCallback(async (event: Omit<LocalEvent, "id" | "synced" | "createdAt" | "updatedAt">) => {
    try {
      await localStorage.addEvent(event as LocalEvent);
      await loadEvents();
    } catch (err) {
      setError("Failed to add event");
      console.error(err);
    }
  }, [loadEvents]);

  const updateEvent = useCallback(async (id: string, updates: Partial<LocalEvent>) => {
    try {
      await localStorage.updateEvent(id, updates);
      await loadEvents();
    } catch (err) {
      setError("Failed to update event");
      console.error(err);
    }
  }, [loadEvents]);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      await localStorage.deleteEvent(id);
      await loadEvents();
    } catch (err) {
      setError("Failed to delete event");
      console.error(err);
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
  };
}

export function useOfflineSync() {
  const [pendingEvents, setPendingEvents] = useState<LocalEvent[]>([]);
  const [syncing, setSyncing] = useState(false);

  const checkPending = useCallback(async () => {
    const pending = await localStorage.getUnsyncedEvents();
    setPendingEvents(pending);
  }, []);

  useEffect(() => {
    checkPending();
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, [checkPending]);

  const syncAll = useCallback(async (remotePush: (events: LocalEvent[]) => Promise<void>) => {
    if (pendingEvents.length === 0) return;

    setSyncing(true);
    try {
      await remotePush(pendingEvents);
      for (const event of pendingEvents) {
        await localStorage.markEventSynced(event.id);
      }
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

export async function encryptMemoryForAI(
  memory: Omit<EncryptedMemory, "encryptedContent">
): Promise<EncryptedMemory> {
  const encryptedContent = await encrypt(memory.content);
  
  return {
    ...memory,
    encryptedContent: JSON.stringify(encryptedContent),
  };
}

export async function decryptMemoryFromAI(
  encrypted: EncryptedMemory
): Promise<string> {
  try {
    const data = JSON.parse(encrypted.encryptedContent);
    return await decrypt(data);
  } catch {
    return encrypted.content;
  }
}
