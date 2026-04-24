"use client";

import { useState, useCallback, useEffect } from "react";
import {
  generateMasterKey,
  encryptData,
  decryptData,
  setMasterKey,
  hasMasterKey,
  clearMasterKey,
  setupMasterKey,
  unlockWithMasterKey,
  type MasterKeyStorage,
  type EncryptedPayload,
  generateRandomBytes,
} from "@/lib/e2ee";
import { cacheCalendarKey, generateCalendarKey } from "@/lib/calendar-keys";

const STORAGE_KEY = "vancal-encryption-init";
const ENCRYPTION_STORAGE_KEY = "vancal-encryption-keys";
const LAST_SYSTEM_KEY = "vancal-last-system";

interface StoredEncryptionData {
  encryptedMasterKey: string;
  salt: string;
  iv: string;
  createdAt: number;
}

export type EncryptionStatus = "unlocked" | "locked" | "initializing" | "error" | "needs-setup";

export interface UseEncryptionResult {
  status: EncryptionStatus;
  isInitialized: boolean;
  unlock: (password: string) => Promise<boolean>;
  setup: (password: string) => Promise<{ success: boolean; recoveryPhrase?: string }>;
  lock: () => void;
  encrypt: <T>(data: T) => Promise<EncryptedPayload>;
  decrypt: <T>(encrypted: EncryptedPayload) => Promise<T>;
  error: string | null;
}

function getStoredEncryptionData(): StoredEncryptionData | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(ENCRYPTION_STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function saveEncryptionData(data: StoredEncryptionData): void {
  localStorage.setItem(ENCRYPTION_STORAGE_KEY, JSON.stringify(data));
}

export function useEncryption(userId?: string): UseEncryptionResult {
  const [status, setStatus] = useState<EncryptionStatus>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedData = getStoredEncryptionData();
    
    if (storedData) {
      setStatus("locked");
    } else {
      setStatus("needs-setup");
    }
    setIsInitialized(true);
  }, []);

  const unlock = useCallback(
    async (password: string): Promise<boolean> => {
      setStatus("initializing");
      setError(null);

      try {
        const storedData = getStoredEncryptionData();

        if (!storedData) {
          setError("No encryption keys found. Please set up encryption first.");
          setStatus("needs-setup");
          return false;
        }

        const storage: MasterKeyStorage = {
          encryptedMasterKey: storedData.encryptedMasterKey,
          salt: storedData.salt,
          iv: storedData.iv,
          iterations: 150000,
          stretchingRounds: 3,
        };

        const success = await unlockWithMasterKey(password, storage);

        if (success) {
          const calendarKey = await generateCalendarKey();
          cacheCalendarKey("personal", calendarKey);
          setStatus("unlocked");
          return true;
        } else {
          setError("Invalid password");
          setStatus("locked");
          return false;
        }
      } catch (e) {
        console.error("Failed to unlock:", e);
        setError("Failed to unlock encryption");
        setStatus("locked");
        return false;
      }
    },
    []
  );

  const setup = useCallback(
    async (password: string): Promise<{ success: boolean; recoveryPhrase?: string }> => {
      setStatus("initializing");
      setError(null);

      try {
        const masterKey = await generateMasterKey();

        const {
          success: _,
          recoveryPhrase,
          storage,
        } = await setupMasterKey(password);

        if (!storage || !recoveryPhrase) {
          setError("Failed to generate encryption keys");
          setStatus("needs-setup");
          return { success: false };
        }

        saveEncryptionData({
          encryptedMasterKey: storage.encryptedMasterKey,
          salt: storage.salt,
          iv: storage.iv,
          createdAt: Date.now(),
        });

        setMasterKey(masterKey);

        const calendarKey = await generateCalendarKey();
        cacheCalendarKey("personal", calendarKey);

        setStatus("unlocked");
        localStorage.setItem(STORAGE_KEY, "true");

        return { success: true, recoveryPhrase };
      } catch (e) {
        console.error("Failed to setup encryption:", e);
        setError("Failed to setup encryption");
        setStatus("needs-setup");
        return { success: false };
      }
    },
    []
  );

  const lock = useCallback(() => {
    clearMasterKey();
    setStatus("locked");
  }, []);

  const encrypt = useCallback(
    async <T,>(data: T): Promise<EncryptedPayload> => {
      if (!hasMasterKey()) {
        throw new Error("Encryption not unlocked");
      }
      return encryptData(data as object);
    },
    []
  );

  const decrypt = useCallback(
    async <T,>(encrypted: EncryptedPayload): Promise<T> => {
      if (!hasMasterKey()) {
        throw new Error("Encryption not unlocked");
      }
      return decryptData(encrypted) as Promise<T>;
    },
    []
  );

  return {
    status,
    isInitialized,
    unlock,
    setup,
    lock,
    encrypt,
    decrypt,
    error,
  };
}

export function getLastSystem(): string {
  if (typeof window === "undefined") return "Work";
  return localStorage.getItem(LAST_SYSTEM_KEY) || "Work";
}

export function setLastSystem(system: string): void {
  localStorage.setItem(LAST_SYSTEM_KEY, system);
}