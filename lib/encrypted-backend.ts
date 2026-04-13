/**
 * Encrypted Backend Storage
 * Client-side encryption before storage (localStorage/IndexedDB/Convex)
 * Ensures server never sees plaintext data
 */

import { arrayBufferToBase64, base64ToArrayBuffer, generateRandomBytes } from "./e2ee";

export interface EncryptedStorageRecord {
  id: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  dataHash: string;
  createdAt: number;
  updatedAt: number;
  version: number;
  checksum: string;
}

export interface StorageMetadata {
  totalRecords: number;
  totalSize: number;
  lastBackup: number | null;
  lastSync: number | null;
  encryptionVersion: number;
  storageType: StorageType;
}

export type StorageType = "local" | "indexeddb" | "convex" | "hybrid";

export interface BackupMetadata {
  id: string;
  createdAt: number;
  size: number;
  recordCount: number;
  checksum: string;
  encryptionVersion: number;
}

export interface SyncStatus {
  lastSync: number;
  pendingChanges: number;
  conflicts: SyncConflict[];
  status: "idle" | "syncing" | "error";
}

export interface SyncConflict {
  recordId: string;
  localVersion: number;
  remoteVersion: number;
  resolution?: "local" | "remote" | "merge";
}

const STORAGE_KEY_PREFIX = "van_";
const MAX_LOCAL_STORAGE = 5 * 1024 * 1024;
const ENCRYPTION_ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

let currentStorageType: StorageType = "local";
const storageCache = new Map<string, EncryptedStorageRecord>();

export function setStorageType(type: StorageType): void {
  currentStorageType = type;
}

export function getStorageType(): StorageType {
  return currentStorageType;
}

export async function encryptForStorage<T>(
  data: T,
  key: CryptoKey
): Promise<EncryptedStorageRecord> {
  const jsonData = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBytes = encoder.encode(jsonData);

  const iv = await generateRandomBytes(IV_LENGTH);
  const encrypted = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    dataBytes
  );

  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBytes);
  const checksumBuffer = await crypto.subtle.digest("SHA-256", encrypted);

  const record: EncryptedStorageRecord = {
    id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    encryptedData: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    authTag: "",
    dataHash: arrayBufferToBase64(hashBuffer),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    checksum: arrayBufferToBase64(checksumBuffer),
  };

  return record;
}

export async function decryptFromStorage<T>(
  record: EncryptedStorageRecord,
  key: CryptoKey
): Promise<T | null> {
  try {
    const encrypted = base64ToArrayBuffer(record.encryptedData);
    const iv = base64ToArrayBuffer(record.iv);

    const decrypted = await crypto.subtle.decrypt(
      { name: ENCRYPTION_ALGORITHM, iv: iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    const jsonData = decoder.decode(decrypted);
    return JSON.parse(jsonData) as T;
  } catch {
    return null;
  }
}

export async function storeEncryptedRecord(
  table: string,
  id: string,
  record: EncryptedStorageRecord,
  storageKey: CryptoKey
): Promise<void> {
  const key = `${STORAGE_KEY_PREFIX}${table}_${id}`;
  const encrypted = record.encryptedData;

  if (currentStorageType === "local") {
    try {
      localStorage.setItem(key, encrypted);
    } catch {
      await cleanupOldRecords(table, storageKey);
      localStorage.setItem(key, encrypted);
    }
  } else if (currentStorageType === "indexeddb") {
    await storeInIndexedDB(table, id, record);
  }

  storageCache.set(key, record);
}

export async function retrieveEncryptedRecord(
  table: string,
  id: string
): Promise<EncryptedStorageRecord | null> {
  const key = `${STORAGE_KEY_PREFIX}${table}_${id}`;

  if (storageCache.has(key)) {
    return storageCache.get(key)!;
  }

  if (currentStorageType === "local") {
    const data = localStorage.getItem(key);
    if (!data) return null;

    const cached: EncryptedStorageRecord = {
      id,
      encryptedData: data,
      iv: "",
      authTag: "",
      dataHash: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      version: 1,
      checksum: "",
    };
    return cached;
  } else if (currentStorageType === "indexeddb") {
    return retrieveFromIndexedDB(table, id);
  }

  return null;
}

export async function deleteEncryptedRecord(
  table: string,
  id: string
): Promise<void> {
  const key = `${STORAGE_KEY_PREFIX}${table}_${id}`;
  storageCache.delete(key);

  if (currentStorageType === "local") {
    localStorage.removeItem(key);
  } else if (currentStorageType === "indexeddb") {
    await deleteFromIndexedDB(table, id);
  }
}

export async function getStorageMetadata(table: string): Promise<StorageMetadata> {
  let totalRecords = 0;
  let totalSize = 0;

  if (currentStorageType === "local") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_KEY_PREFIX}${table}_`)) {
        totalRecords++;
        totalSize += localStorage.getItem(key)?.length || 0;
      }
    }
  }

  return {
    totalRecords,
    totalSize,
    lastBackup: null,
    lastSync: null,
    encryptionVersion: 1,
    storageType: currentStorageType,
  };
}

async function storeInIndexedDB(
  table: string,
  id: string,
  record: EncryptedStorageRecord
): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VanCalendarEncrypted", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(table, "readwrite");
      const store = tx.objectStore(table);
      store.put({ ...record, id });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(table)) {
        db.createObjectStore(table, { keyPath: "id" });
      }
    };
  });
}

async function retrieveFromIndexedDB(
  table: string,
  id: string
): Promise<EncryptedStorageRecord | null> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VanCalendarEncrypted", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(table, "readonly");
      const store = tx.objectStore(table);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => resolve(getRequest.result || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
  });
}

async function deleteFromIndexedDB(table: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VanCalendarEncrypted", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(table, "readwrite");
      const store = tx.objectStore(table);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}

async function cleanupOldRecords(
  table: string,
  storageKey: CryptoKey
): Promise<void> {
  const records: Array<{ key: string; data: string }> = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${STORAGE_KEY_PREFIX}${table}_`)) {
      const data = localStorage.getItem(key);
      if (data) records.push({ key, data });
    }
  }

  records.sort((a, b) => a.data.length - b.data.length);

  let totalSize = records.reduce((sum, r) => sum + r.data.length, 0);
  const maxToRemove = Math.floor(records.length * 0.2);

  for (let i = 0; i < maxToRemove && totalSize > MAX_LOCAL_STORAGE; i++) {
    const record = records[i];
    totalSize -= record.data.length;
    localStorage.removeItem(record.key);
  }
}

export async function exportStorage(
  table: string,
  encryptionKey: CryptoKey
): Promise<string> {
  const records: EncryptedStorageRecord[] = [];

  if (currentStorageType === "local") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(`${STORAGE_KEY_PREFIX}${table}_`)) {
        const data = localStorage.getItem(key);
        if (data) {
          records.push({
            id: key.replace(`${STORAGE_KEY_PREFIX}${table}_`, ""),
            encryptedData: data,
            iv: "",
            authTag: "",
            dataHash: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            version: 1,
            checksum: "",
          });
        }
      }
    }
  }

  const exportData = {
    version: 1,
    table,
    exportedAt: Date.now(),
    records,
  };

  return btoa(JSON.stringify(exportData));
}

export async function importStorage(
  data: string,
  table: string,
  encryptionKey: CryptoKey
): Promise<{ imported: number; errors: number }> {
  try {
    const importData = JSON.parse(atob(data));
    let imported = 0;
    let errors = 0;

    for (const record of importData.records || []) {
      try {
        await storeEncryptedRecord(table, record.id, record, encryptionKey);
        imported++;
      } catch {
        errors++;
      }
    }

    return { imported, errors };
  } catch {
    return { imported: 0, errors: 1 };
  }
}

export async function clearStorage(table?: string): Promise<void> {
  storageCache.clear();

  if (table) {
    if (currentStorageType === "local") {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key?.startsWith(`${STORAGE_KEY_PREFIX}${table}_`)) {
          localStorage.removeItem(key);
        }
      }
    }
  } else {
    localStorage.clear();
  }
}

export function getStorageUsage(): { used: number; available: number; percentage: number } {
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      used += localStorage.getItem(key)?.length || 0;
    }
  }

  return {
    used,
    available: MAX_LOCAL_STORAGE - used,
    percentage: (used / MAX_LOCAL_STORAGE) * 100,
  };
}