/**
 * End-to-End Encryption (E2EE) Library
 * Multi-device-safe key management using password-derived keys
 * 
 * Security Properties:
 * - AES-GCM with 256-bit keys for authenticated encryption
 * - PBKDF2 with 600,000 iterations for key derivation
 * - Random 12-byte IV per encryption
 * - 16-byte random salt for key stretching
 * - Master key stored encrypted in backend (never in plaintext)
 * - Decrypted key kept only in memory (never persisted)
 */

import { EncryptedPayload, MasterKeyStorage, RecoveryKeyData } from "../model/types";

export type { EncryptedPayload, MasterKeyStorage, RecoveryKeyData } from "../model/types";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const ITERATIONS = 600000;

let masterKeyInMemory: CryptoKey | null = null;

export function isEncryptionAvailable(): boolean {
  return typeof crypto !== "undefined" && crypto.subtle !== undefined;
}

export async function generateRandomBytes(length: number): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(length));
}

export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export async function deriveKeyFromPassword(
  password: string,
  salt: Uint8Array | ArrayBuffer
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltBuffer = salt instanceof Uint8Array ? salt.buffer as ArrayBuffer : salt;

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function generateMasterKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKey(key: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey("raw", key);
}

export async function importKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptMasterKey(
  masterKey: CryptoKey,
  passwordKey: CryptoKey
): Promise<MasterKeyStorage> {
  const exportedKey = await exportKey(masterKey);
  const iv = await generateRandomBytes(IV_LENGTH);
  const salt = await generateRandomBytes(SALT_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    passwordKey,
    exportedKey
  );

  return {
    encryptedMasterKey: arrayBufferToBase64(ciphertext),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptMasterKey(
  encrypted: MasterKeyStorage,
  passwordKey: CryptoKey
): Promise<CryptoKey> {
  const ciphertext = base64ToArrayBuffer(encrypted.encryptedMasterKey);
  const iv = base64ToArrayBuffer(encrypted.iv);

  const decryptedKeyData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    passwordKey,
    ciphertext
  );

  return await importKey(decryptedKeyData);
}

export async function generateRecoveryPhrase(): Promise<string> {
  const bytes = await generateRandomBytes(32);
  const base64 = arrayBufferToBase64(bytes);
  const cleanBase64 = base64.replace(/[+/=]/g, "").substring(0, 32);
  
  const chunks: string[] = [];
  for (let i = 0; i < 4; i++) {
    chunks.push(cleanBase64.substring(i * 8, (i + 1) * 8));
  }
  return chunks.join("-");
}

export async function deriveKeyFromRecoveryPhrase(recoveryPhrase: string): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  const normalized = recoveryPhrase.replace(/-/g, "").toLowerCase();
  const salt = await generateRandomBytes(SALT_LENGTH);
  const key = await deriveKeyFromPassword(normalized, salt);
  return { key, salt };
}

export async function createRecoveryData(
  masterKey: CryptoKey,
  recoveryPhrase: string
): Promise<RecoveryKeyData> {
  const { key: recoveryKey, salt } = await deriveKeyFromRecoveryPhrase(recoveryPhrase);
  const iv = await generateRandomBytes(IV_LENGTH);

  const exportedMasterKey = await exportKey(masterKey);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    recoveryKey,
    exportedMasterKey
  );

  return {
    recoveryKey: recoveryPhrase,
    encryptedMasterKey: arrayBufferToBase64(ciphertext),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
  };
}

export async function recoverMasterKeyFromPhrase(
  recoveryData: RecoveryKeyData,
  recoveryPhrase: string
): Promise<CryptoKey> {
  const normalized = recoveryPhrase.replace(/-/g, "").toLowerCase();
  const salt = base64ToArrayBuffer(recoveryData.salt);
  
  const recoveryKeyObj = await deriveKeyFromPassword(normalized, salt);
  
  const ciphertext = base64ToArrayBuffer(recoveryData.encryptedMasterKey);
  const iv = base64ToArrayBuffer(recoveryData.iv);

  const decryptedKeyData = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    recoveryKeyObj,
    ciphertext
  );

  return await importKey(decryptedKeyData);
}

export async function encryptData(
  data: object,
  key?: CryptoKey
): Promise<EncryptedPayload> {
  if (!key) {
    if (!masterKeyInMemory) {
      throw new Error("No encryption key available. Please unlock the app first.");
    }
    key = masterKeyInMemory;
  }

  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);

  const iv = await generateRandomBytes(IV_LENGTH);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    key,
    dataBuffer
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
  };
}

export async function decryptData<T = object>(
  encrypted: EncryptedPayload,
  key?: CryptoKey
): Promise<T> {
  if (!key) {
    if (!masterKeyInMemory) {
      throw new Error("No encryption key available. Please unlock the app first.");
    }
    key = masterKeyInMemory;
  }

  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decrypted);

  return JSON.parse(jsonString) as T;
}

export function hasMasterKey(): boolean {
  return masterKeyInMemory !== null;
}

export function setMasterKey(key: CryptoKey): void {
  masterKeyInMemory = key;
}

export function getMasterKey(): CryptoKey | null {
  return masterKeyInMemory;
}

export function clearMasterKey(): void {
  masterKeyInMemory = null;
}

export async function verifyPassword(
  password: string,
  encrypted: MasterKeyStorage
): Promise<boolean> {
  try {
    const salt = base64ToArrayBuffer(encrypted.salt);
    const passwordKey = await deriveKeyFromPassword(password, salt);
    await decryptMasterKey(encrypted, passwordKey);
    return true;
  } catch {
    return false;
  }
}

export async function setupMasterKey(password: string): Promise<{ success: boolean; recoveryPhrase?: string; storage?: MasterKeyStorage }> {
  try {
    const masterKey = await generateMasterKey();
    const passwordSalt = await generateRandomBytes(SALT_LENGTH);
    const passwordKey = await deriveKeyFromPassword(password, passwordSalt);
    const storage = await encryptMasterKey(masterKey, passwordKey);
    
    const recoveryPhrase = await generateRecoveryPhrase();
    const recoveryData = await createRecoveryData(masterKey, recoveryPhrase);
    
    setMasterKey(masterKey);
    
    return { success: true, recoveryPhrase, storage };
  } catch (error) {
    console.error("Failed to setup master key:", error);
    return { success: false };
  }
}

export async function unlockWithMasterKey(password: string, storage: MasterKeyStorage): Promise<boolean> {
  try {
    const salt = base64ToArrayBuffer(storage.salt);
    const passwordKey = await deriveKeyFromPassword(password, salt);
    const masterKey = await decryptMasterKey(storage, passwordKey);
    setMasterKey(masterKey);
    return true;
  } catch (error) {
    console.error("Failed to unlock with master key:", error);
    return false;
  }
}