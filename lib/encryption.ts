/**
 * Encryption utilities for sensitive calendar data
 * Uses Web Crypto API for browser-based encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  salt: string;
}

export interface EncryptionKey {
  key: CryptoKey;
  salt: Uint8Array;
}

let cachedKey: EncryptionKey | null = null;

export async function generateKey(): Promise<CryptoKey> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    salt,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<EncryptionKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  const keySalt = salt ? new Uint8Array(salt.buffer) : crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: keySalt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );

  return { key, salt: keySalt };
}

export async function encrypt(
  plaintext: string,
  key?: CryptoKey
): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const encryptionKey = key || (await getOrCreateKey());
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv.buffer as ArrayBuffer },
    encryptionKey,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    salt: cachedKey ? arrayBufferToBase64(cachedKey.salt.buffer as ArrayBuffer) : "",
  };
}

export async function decrypt(
  encrypted: EncryptedData,
  key?: CryptoKey
): Promise<string> {
  const decoder = new TextDecoder();
  
  const ciphertext = base64ToArrayBuffer(encrypted.ciphertext);
  const iv = base64ToArrayBuffer(encrypted.iv);
  
  const decryptionKey = key || (await getOrCreateKey());
  
  const plaintext = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv).buffer as ArrayBuffer },
    decryptionKey,
    ciphertext
  );

  return decoder.decode(plaintext);
}

async function getOrCreateKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey.key;
  }
  
  const storedSalt = localStorage.getItem("calendar_salt");
  
  if (storedSalt) {
    const saltBuffer = base64ToArrayBuffer(storedSalt);
    cachedKey = await deriveKeyFromPassword(
      "default-calendar-key",
      new Uint8Array(saltBuffer)
    );
  } else {
    cachedKey = await deriveKeyFromPassword("default-calendar-key");
    localStorage.setItem(
      "calendar_salt",
      arrayBufferToBase64(cachedKey.salt.buffer as ArrayBuffer)
    );
  }
  
  return cachedKey.key;
}

export async function setEncryptionPassword(password: string): Promise<void> {
  cachedKey = await deriveKeyFromPassword(password);
  localStorage.setItem(
    "calendar_salt",
    arrayBufferToBase64(cachedKey.salt)
  );
}

export async function clearEncryptionKey(): Promise<void> {
  cachedKey = null;
}

function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function isEncryptionAvailable(): boolean {
  return typeof crypto !== "undefined" && crypto.subtle !== undefined;
}

export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  return arrayBufferToBase64(hashBuffer);
}
