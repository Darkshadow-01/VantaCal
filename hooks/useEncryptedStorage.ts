"use client";

import { useState, useCallback, useEffect } from "react";
import {
  encryptForStorage,
  decryptFromStorage,
  storeEncryptedRecord,
  retrieveEncryptedRecord,
  deleteEncryptedRecord,
  getStorageMetadata,
  exportStorage,
  importStorage,
  clearStorage,
  getStorageUsage,
  setStorageType,
  getStorageType,
  type StorageMetadata,
  type EncryptedStorageRecord,
  type StorageType,
} from "@/lib/encrypted-backend";
import {
  getStorageKey,
  getOrCreateStorageKey,
  hasStorageKey,
  initializeMasterKey,
  clearMasterKey,
  type StorageKey,
} from "@/lib/storage-keys";

export interface EncryptedRecord<T> {
  id: string;
  data: T;
  createdAt: number;
  updatedAt: number;
}

export interface UseEncryptedStorageReturn<T> {
  isInitialized: boolean;
  storageType: StorageType;
  metadata: StorageMetadata | null;
  storageUsage: { used: number; available: number; percentage: number };
  isLoading: boolean;
  error: string | null;
  setStorage: (type: StorageType) => void;
  save: (id: string, data: T) => Promise<void>;
  load: (id: string) => Promise<T | null>;
  remove: (id: string) => Promise<void>;
  list: () => Promise<EncryptedRecord<T>[]>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<{ imported: number; errors: number }>;
  clear: () => Promise<void>;
}

export function useEncryptedStorage<T>(
  table: string,
  password: string
): UseEncryptedStorageReturn<T> {
  const [isInitialized, setIsInitialized] = useState(false);
  const [metadata, setMetadata] = useState<StorageMetadata | null>(null);
  const [storageUsage, setStorageUsage] = useState({ used: 0, available: 0, percentage: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageType = getStorageType();

  useEffect(() => {
    init();
  }, [table, password]);

  const init = async () => {
    try {
      await getOrCreateStorageKey(table, password);
      setIsInitialized(true);
      await refreshMetadata();
      setStorageUsage(getStorageUsage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to initialize storage");
    }
  };

  const refreshMetadata = async () => {
    const meta = await getStorageMetadata(table);
    setMetadata(meta);
  };

  const setStorage = useCallback((type: StorageType) => {
    setStorageType(type);
  }, []);

  const save = useCallback(
    async (id: string, data: T) => {
      setIsLoading(true);
      setError(null);

      try {
        const key = await getOrCreateStorageKey(table, password);
        const record = await encryptForStorage(data, key);
        await storeEncryptedRecord(table, id, record, key);
        await refreshMetadata();
        setStorageUsage(getStorageUsage());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to save data");
      } finally {
        setIsLoading(false);
      }
    },
    [table, password]
  );

  const load = useCallback(
    async (id: string): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const key = await getOrCreateStorageKey(table, password);
        const stored = await retrieveEncryptedRecord(table, id);

        if (!stored) return null;

        const data = await decryptFromStorage(stored, key);
        return data as T | null;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load data");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [table, password]
  );

  const remove = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await deleteEncryptedRecord(table, id);
        await refreshMetadata();
        setStorageUsage(getStorageUsage());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to remove data");
      } finally {
        setIsLoading(false);
      }
    },
    [table]
  );

  const list = useCallback(async (): Promise<EncryptedRecord<T>[]> => {
    const records: EncryptedRecord<T>[] = [];
    const key = await getOrCreateStorageKey(table, password);

    for (let i = 0; i < localStorage.length; i++) {
      const localKey = localStorage.key(i);
      if (localKey?.startsWith(`van_${table}_`)) {
        const id = localKey.replace(`van_${table}_`, "");
        const data = await load(id);
        if (data) {
          records.push({
            id,
            data,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    return records;
  }, [table, password, load]);

  const exportData = useCallback(async (): Promise<string> => {
    const key = await getOrCreateStorageKey(table, password);
    return exportStorage(table, key);
  }, [table, password]);

  const importData = useCallback(
    async (data: string): Promise<{ imported: number; errors: number }> => {
      const key = await getOrCreateStorageKey(table, password);
      return importStorage(data, table, key);
    },
    [table, password]
  );

  const clear = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await clearStorage(table);
      await refreshMetadata();
      setStorageUsage(getStorageUsage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear storage");
    } finally {
      setIsLoading(false);
    }
  }, [table]);

  return {
    isInitialized,
    storageType,
    metadata,
    storageUsage,
    isLoading,
    error,
    setStorage,
    save,
    load,
    remove,
    list,
    exportData,
    importData,
    clear,
  };
}

export function useEventStorage(password: string) {
  const events = useEncryptedStorage<{
    id: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    allDay: boolean;
    location?: string;
    color?: string;
    calendarId?: string;
  }>("events", password);

  return events;
}

export function useCalendarStorage(password: string) {
  const calendars = useEncryptedStorage<{
    id: string;
    name: string;
    description?: string;
    color: string;
    visible: boolean;
    readOnly: boolean;
  }>("calendars", password);

  return calendars;
}

export function useSettingsStorage(password: string) {
  const settings = useEncryptedStorage<{
    key: string;
    value: unknown;
  }>("settings", password);

  return settings;
}