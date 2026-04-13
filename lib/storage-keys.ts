/**
 * Storage Keys Management
 * Handles encryption keys for different storage backends
 * Keys are derived from master key but never stored in plaintext
 */

import { arrayBufferToBase64, base64ToArrayBuffer, deriveKeyFromPassword, importKey } from "./e2ee";

export interface StorageKey {
  id: string;
  table: string;
  key: CryptoKey;
  createdAt: number;
  version: number;
}

export interface KeyDerivationParams {
  salt: string;
  iterations: number;
  algorithm: string;
  length: number;
}

const DEFAULT_PARAMS: KeyDerivationParams = {
  salt: "van-calendar-storage-v1",
  iterations: 100000,
  algorithm: "AES-GCM",
  length: 256,
};

const storageKeys = new Map<string, StorageKey>();
let masterKey: CryptoKey | null = null;

export async function initializeMasterKey(
  password: string,
  salt?: string
): Promise<CryptoKey> {
  const actualSalt = salt || DEFAULT_PARAMS.salt;
  
  const encoder = new TextEncoder();
  masterKey = await deriveKeyFromPassword(password, encoder.encode(actualSalt), DEFAULT_PARAMS.iterations);
  
  return masterKey!;
}

export function setMasterKey(key: CryptoKey): void {
  masterKey = key;
}

export function getMasterKey(): CryptoKey | null {
  return masterKey;
}

export function clearMasterKey(): void {
  masterKey = null;
  storageKeys.clear();
}

export async function getStorageKey(
  table: string,
  password?: string
): Promise<CryptoKey | null> {
  const existing = storageKeys.get(table);
  if (existing) {
    return existing.key;
  }

  if (masterKey) {
    const key = await deriveStorageKey(masterKey, table);
    storageKeys.set(table, {
      id: `key-${table}`,
      table,
      key,
      createdAt: Date.now(),
      version: 1,
    });
return key as CryptoKey;
  }

  return null;
}

async function deriveStorageKey(
  baseKey: CryptoKey,
  table: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const info = `storage-${table}`;
  
  const keyMaterial = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt: encoder.encode(DEFAULT_PARAMS.salt),
      info: encoder.encode(info),
      hash: "SHA-256",
    },
    baseKey,
    { name: DEFAULT_PARAMS.algorithm, length: DEFAULT_PARAMS.length },
    false,
    ["encrypt", "decrypt"]
  );

  return keyMaterial;
}

export async function getOrCreateStorageKey(
  table: string,
  password: string
): Promise<CryptoKey> {
  const existing = storageKeys.get(table);
  if (existing) {
    return existing.key;
  }

  const encoder = new TextEncoder();
  const key = await deriveKeyFromPassword(password, encoder.encode(`${table}-storage`), 100000);
  
  storageKeys.set(table, {
    id: `key-${table}`,
    table,
    key,
    createdAt: Date.now(),
    version: 1,
  });

  return key;
}

export async function rotateStorageKey(
  table: string,
  oldKey: CryptoKey,
  password: string
): Promise<CryptoKey> {
  storageKeys.delete(table);
  
  return getOrCreateStorageKey(table, password);
}

export function getKeyMetadata(table: string): {
  exists: boolean;
  createdAt: number | null;
  version: number | null;
} {
  const key = storageKeys.get(table);
  return {
    exists: !!key,
    createdAt: key?.createdAt || null,
    version: key?.version || null,
  };
}

export function hasStorageKey(table: string): boolean {
  return storageKeys.has(table);
}

export function listTables(): string[] {
  return Array.from(storageKeys.keys());
}

export async function exportKeyBundle(): Promise<string> {
  const keys = Array.from(storageKeys.entries()).map(([table, key]) => ({
    table,
    createdAt: key.createdAt,
    version: key.version,
  }));

  return btoa(JSON.stringify(keys));
}

export function clearAllKeys(): void {
  storageKeys.clear();
}

export async function reEncryptTable(
  table: string,
  oldKey: CryptoKey,
  newKey: CryptoKey,
  records: Array<{ id: string; data: unknown }>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  for (const record of records) {
    try {
      const json = JSON.stringify(record.data);
      const encoder = new TextEncoder();
      const data = encoder.encode(json);

      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: new Uint8Array(12) },
        oldKey,
        data
      );

      success++;
    } catch {
      failed++;
    }
  }

  return { success, failed };
}