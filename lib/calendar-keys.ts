/**
 * Calendar Keys Management
 * Per-calendar encryption keys using ECC Curve25519
 * 
 * Each calendar gets its own symmetric key that's encrypted with
 * the user's master key. This enables:
 * - Independent calendar encryption
 * - Calendar sharing (encrypt key per member)
 * - Granular access control per calendar
 */

import { generateRandomBytes, arrayBufferToBase64, base64ToArrayBuffer, exportKey, importKey } from "./e2ee";

const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const ALGORITHM = "AES-GCM";

export interface CalendarKey {
  id: string;
  key: CryptoKey;
  createdAt: number;
  version: number;
}

export interface EncryptedCalendarKey {
  calendarId: string;
  encryptedKey: string;
  iv: string;
  publicKey?: string;
  version: number;
  createdAt: number;
  updatedAt: number;
}

export interface CalendarMemberKey {
  userId: string;
  encryptedCalendarKey: string;
  iv: string;
  publicKey: string;
  accessLevel: "read" | "write" | "admin";
  addedAt: number;
  addedBy: string;
}

export interface CalendarKeysCollection {
  calendarId: string;
  ownerKey: EncryptedCalendarKey;
  memberKeys: CalendarMemberKey[];
  publicKey?: string;
  version: number;
}

const calendarKeysCache: Map<string, CalendarKey> = new Map();

export function isKeyEncryptionAvailable(): boolean {
  return typeof crypto !== "undefined" && crypto.subtle !== undefined;
}

export async function generateCalendarKey(): Promise<CalendarKey> {
  const key = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );

  return {
    id: `cal-key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    key,
    createdAt: Date.now(),
    version: 1,
  };
}

export async function exportCalendarKey(key: CalendarKey): Promise<string> {
  const exported = await exportKey(key.key);
  return arrayBufferToBase64(exported);
}

export async function importCalendarKey(keyData: string): Promise<CalendarKey> {
  const imported = await importKey(base64ToArrayBuffer(keyData));
  return {
    id: `cal-key-imported-${Date.now()}`,
    key: imported,
    createdAt: Date.now(),
    version: 1,
  };
}

export async function encryptCalendarKeyWithMaster(
  calendarKey: CalendarKey,
  masterKey: CryptoKey
): Promise<EncryptedCalendarKey> {
  const exportedKey = await exportKey(calendarKey.key);
  const iv = await generateRandomBytes(IV_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    masterKey,
    exportedKey
  );

  return {
    calendarId: calendarKey.id,
    encryptedKey: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    version: calendarKey.version,
    createdAt: calendarKey.createdAt,
    updatedAt: Date.now(),
  };
}

export async function decryptCalendarKeyWithMaster(
  encryptedKey: EncryptedCalendarKey,
  masterKey: CryptoKey
): Promise<CalendarKey> {
  const ciphertext = base64ToArrayBuffer(encryptedKey.encryptedKey);
  const iv = base64ToArrayBuffer(encryptedKey.iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    masterKey,
    ciphertext
  );

  const importedKey = await importKey(decrypted);
  return {
    id: encryptedKey.calendarId,
    key: importedKey,
    createdAt: encryptedKey.createdAt,
    version: encryptedKey.version,
  };
}

export function cacheCalendarKey(calendarId: string, calendarKey: CalendarKey): void {
  calendarKeysCache.set(calendarId, calendarKey);
}

export function getCachedCalendarKey(calendarId: string): CalendarKey | undefined {
  return calendarKeysCache.get(calendarId);
}

export function clearCalendarKeyCache(): void {
  calendarKeysCache.clear();
}

export function removeCalendarKeyFromCache(calendarId: string): void {
  calendarKeysCache.delete(calendarId);
}

export async function rotateCalendarKey(
  calendarId: string,
  masterKey: CryptoKey
): Promise<{ oldKey: EncryptedCalendarKey; newKey: EncryptedCalendarKey }> {
  const existingKey = getCachedCalendarKey(calendarId);
  
  if (existingKey) {
    const oldEncrypted = await encryptCalendarKeyWithMaster(existingKey, masterKey);
    const newKey = await generateCalendarKey();
    const newEncrypted = await encryptCalendarKeyWithMaster(newKey, masterKey);
    
    cacheCalendarKey(calendarId, newKey);
    
    return { oldKey: oldEncrypted, newKey: newEncrypted };
  }
  
  const newKey = await generateCalendarKey();
  const newEncrypted = await encryptCalendarKeyWithMaster(newKey, masterKey);
  cacheCalendarKey(calendarId, newKey);
  
  return { oldKey: newEncrypted, newKey: newEncrypted };
}

export async function encryptCalendarMemberKey(
  calendarKey: CalendarKey,
  memberPublicKey: JsonWebKey
): Promise<{ encryptedKey: string; iv: string }> {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    memberPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  const exportedKey = await exportKey(calendarKey.key);
  const iv = await generateRandomBytes(IV_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    publicKey,
    exportedKey
  );

  return {
    encryptedKey: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptCalendarMemberKey(
  encryptedKeyData: { encryptedKey: string; iv: string },
  privateKey: CryptoKey
): Promise<CalendarKey> {
  const ciphertext = base64ToArrayBuffer(encryptedKeyData.encryptedKey);
  const iv = base64ToArrayBuffer(encryptedKeyData.iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    privateKey,
    ciphertext
  );

  const importedKey = await importKey(decrypted);
  return {
    id: `cal-key-member-${Date.now()}`,
    key: importedKey,
    createdAt: Date.now(),
    version: 1,
  };
}

export function hasCalendarKey(calendarId: string): boolean {
  return calendarKeysCache.has(calendarId);
}

export async function deriveCalendarKeyFromPassword(
  calendarId: string,
  password: string,
  salt?: Uint8Array
): Promise<CalendarKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password + calendarId);
  
  const saltValue = salt || await generateRandomBytes(16);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltValue.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  return {
    id: calendarId,
    key: derivedKey,
    createdAt: Date.now(),
    version: 1,
  };
}

export function getCalendarKeyVersions(calendarId: string): number {
  const key = calendarKeysCache.get(calendarId);
  return key?.version || 0;
}