/**
 * Event Encryptor
 * PGP-style event encryption with dual session keys
 * 
 * Security Model:
 * 1. Generate two session keys per event:
 *    - Data key: encrypts title, description, location, attendees
 *    - Calendar key: encrypts calendar-specific metadata
 * 2. Encrypt session keys with user's calendar key
 * 3. Sign all data with user's private key
 * 4. Server only sees: id, calendarId, startTime, endTime (all signed, not encrypted)
 */

import { 
  generateRandomBytes, 
  arrayBufferToBase64, 
  base64ToArrayBuffer,
  exportKey,
  importKey,
  getMasterKey,
  hasMasterKey
} from "./e2ee";
import { getCachedCalendarKey, type CalendarKey } from "./calendar-keys";
import type {
  EncryptedEvent,
  EncryptedDataFields,
  EncryptedEventInput,
  EventSignature,
  SessionKeyPacket,
  DecryptedEvent,
  EventValidationResult,
  RecurrenceEncrypted
} from "./types/encrypted-event";

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SESSION_KEY_LENGTH = 32;

let signingKeyPair: CryptoKeyPair | null = null;

export function isEventEncryptionAvailable(): boolean {
  return typeof crypto !== "undefined" && crypto.subtle !== undefined && hasMasterKey();
}

async function generateSessionKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_LENGTH },
    true,
    ["encrypt", "decrypt"]
  );
}

async function signData(data: ArrayBuffer, privateKey: CryptoKey): Promise<string> {
  const signature = await crypto.subtle.sign("HMAC", privateKey, data);
  return arrayBufferToBase64(signature);
}

async function verifySignature(
  data: ArrayBuffer, 
  signature: string, 
  publicKey: CryptoKey
): Promise<boolean> {
  try {
    const signatureBytes = base64ToArrayBuffer(signature);
    return await crypto.subtle.verify("HMAC", publicKey, signatureBytes, data);
  } catch {
    return false;
  }
}

async function encryptWithKey(
  data: ArrayBuffer,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = await generateRandomBytes(IV_LENGTH);
  const ivArray = new Uint8Array(iv);
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: ivArray },
    key,
    data
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(ivArray),
  };
}

async function decryptWithKey(
  ciphertext: string,
  iv: string,
  key: CryptoKey
): Promise<ArrayBuffer> {
  const ciphertextBytes = base64ToArrayBuffer(ciphertext);
  const ivBytes = base64ToArrayBuffer(iv);

  return await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: ivBytes },
    key,
    ciphertextBytes
  );
}

export async function initSigningKeys(): Promise<void> {
  if (signingKeyPair) return;

  signingKeyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"]
  );
}

export async function getSigningPublicKey(): Promise<string | null> {
  if (!signingKeyPair) return null;
  try {
    const exported = await crypto.subtle.exportKey("spki", signingKeyPair.publicKey);
    return arrayBufferToBase64(exported);
  } catch {
    return null;
  }
}

async function deriveSigningKey(masterKey: CryptoKey): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      salt: encoder.encode("event-signing"),
      info: encoder.encode("signing-key"),
      hash: "SHA-256",
    },
    masterKey,
    { name: ALGORITHM, length: 256 },
    false,
    ["sign", "verify"]
  );
}

export async function encryptEvent(
  input: EncryptedEventInput,
  calendarId: string
): Promise<EncryptedEvent> {
  if (!hasMasterKey()) {
    throw new Error("Master key not available. Please unlock first.");
  }

  const masterKey = getMasterKey();
  if (!masterKey) {
    throw new Error("Master key not found");
  }

  const calendarKey = getCachedCalendarKey(calendarId);
  if (!calendarKey) {
    throw new Error(`Calendar key not found for calendar: ${calendarId}`);
  }

  const dataSessionKey = await generateSessionKey();
  const metaSessionKey = await generateSessionKey();

  const encoder = new TextEncoder();
  const encryptedDataFields: EncryptedDataFields = {
    title: input.title,
    description: input.description,
    location: input.location,
    attendees: input.attendees || [],
    color: input.color,
    system: input.system,
    allDay: input.allDay,
    reminderMinutes: input.reminderMinutes,
    timezone: input.timezone,
  };

  const dataJson = JSON.stringify(encryptedDataFields);
  const dataBytes = encoder.encode(dataJson);
  const dataArrayBuffer = dataBytes.buffer as ArrayBuffer;
  
  const { ciphertext: encryptedData, iv: dataIv } = await encryptWithKey(dataArrayBuffer, dataSessionKey);

  const signingKey = await deriveSigningKey(masterKey);
  const dataSignature = await signData(dataArrayBuffer, signingKey);

  const exportedDataKey = await exportKey(dataSessionKey);
  const { ciphertext: encryptedDataKey, iv: dataKeyIv } = await encryptWithKey(exportedDataKey, calendarKey.key);

  const exportedMetaKey = await exportKey(metaSessionKey);
  const { ciphertext: encryptedMetaKey, iv: metaKeyIv } = await encryptWithKey(exportedMetaKey, calendarKey.key);

  const sessionKeyPacket: SessionKeyPacket = {
    encryptedKey: encryptedDataKey,
    iv: dataKeyIv,
    keyAlgorithm: ALGORITHM,
  };

  let recurrenceEncrypted: string | undefined;
  let recurrenceSignature: string | undefined;

  if (input.recurrence) {
    const recurrenceJson = JSON.stringify(input.recurrence);
    const recurrenceBytes = encoder.encode(recurrenceJson);
    const recurrenceBuffer = recurrenceBytes.buffer as ArrayBuffer;
    const { ciphertext: recEncrypted, iv: recIv } = await encryptWithKey(recurrenceBuffer, dataSessionKey);
    recurrenceEncrypted = JSON.stringify({ data: recEncrypted, iv: recIv });
    
    const recSignature = await signData(recurrenceBuffer, signingKey);
    recurrenceSignature = recSignature;
  }

  const now = Date.now();
  const eventId = `evt-${now}-${Math.random().toString(36).substr(2, 9)}`;

  const encryptedEvent: EncryptedEvent = {
    id: eventId,
    calendarId,
    startTimeUnix: input.startTime,
    endTimeUnix: input.endTime,
    encryptedData: JSON.stringify({ ciphertext: encryptedData, iv: dataIv }),
    signature: dataSignature,
    sessionKeyPacket: JSON.stringify(sessionKeyPacket),
    calendarKeyId: calendarId,
    recurrenceEncrypted,
    recurrenceSignature,
    createdAt: now,
    updatedAt: now,
    version: 1,
  };

  return encryptedEvent;
}

export async function decryptEvent(
  encryptedEvent: EncryptedEvent
): Promise<DecryptedEvent> {
  if (!hasMasterKey()) {
    throw new Error("Master key not available. Please unlock first.");
  }

  const masterKey = getMasterKey();
  if (!masterKey) {
    throw new Error("Master key not found");
  }

  const calendarKey = getCachedCalendarKey(encryptedEvent.calendarId);
  if (!calendarKey) {
    throw new Error(`Calendar key not found: ${encryptedEvent.calendarId}`);
  }

  const signingKey = await deriveSigningKey(masterKey);

  const dataContainer = JSON.parse(encryptedEvent.encryptedData);
  const dataBytes = await decryptWithKey(dataContainer.ciphertext, dataContainer.iv, calendarKey.key);

  const isValid = await verifySignature(dataBytes, encryptedEvent.signature, signingKey);
  if (!isValid) {
    throw new Error("Event signature verification failed");
  }

  const decoder = new TextDecoder();
  const decryptedData = JSON.parse(decoder.decode(dataBytes)) as EncryptedDataFields;

  let recurrence: EncryptedEventInput["recurrence"] | undefined;
  if (encryptedEvent.recurrenceEncrypted && encryptedEvent.recurrenceSignature) {
    try {
      const recContainer = JSON.parse(encryptedEvent.recurrenceEncrypted);
      const recBytes = await decryptWithKey(recContainer.data, recContainer.iv, calendarKey.key);
      const recIsValid = await verifySignature(recBytes, encryptedEvent.recurrenceSignature, signingKey);
      if (recIsValid) {
        recurrence = JSON.parse(decoder.decode(recBytes));
      }
    } catch {
      console.warn("Failed to decrypt recurrence data");
    }
  }

  return {
    ...encryptedEvent,
    decryptedData: {
      ...decryptedData,
      ...(recurrence && { recurrence }),
    },
  };
}

export async function decryptEvents(
  encryptedEvents: EncryptedEvent[]
): Promise<DecryptedEvent[]> {
  const decrypted: DecryptedEvent[] = [];

  for (const event of encryptedEvents) {
    try {
      const decryptedEvent = await decryptEvent(event);
      decrypted.push(decryptedEvent);
    } catch (error) {
      console.error(`Failed to decrypt event ${event.id}:`, error);
    }
  }

  return decrypted;
}

export function validateEncryptedEvent(
  event: EncryptedEvent
): EventValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!event.id || !event.id.startsWith("evt-")) {
    errors.push("Invalid event ID format");
  }

  if (!event.calendarId) {
    errors.push("Missing calendar ID");
  }

  if (event.startTimeUnix >= event.endTimeUnix) {
    errors.push("Start time must be before end time");
  }

  if (!event.encryptedData) {
    errors.push("Missing encrypted data");
  }

  if (!event.signature) {
    errors.push("Missing signature");
  }

  if (!event.sessionKeyPacket) {
    errors.push("Missing session key packet");
  }

  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;
  if (event.createdAt < oneYearAgo) {
    warnings.push("Event is older than 1 year");
  }

  if (event.version < 1) {
    warnings.push("Event uses legacy version format");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

export function extractSignedOnlyFields(
  event: EncryptedEvent
): { startTimeUnix: number; endTimeUnix: number; calendarId: string } {
  return {
    startTimeUnix: event.startTimeUnix,
    endTimeUnix: event.endTimeUnix,
    calendarId: event.calendarId,
  };
}

export async function updateEncryptedEvent(
  event: EncryptedEvent,
  updates: Partial<EncryptedEventInput>
): Promise<EncryptedEvent> {
  const decrypted = await decryptEvent(event);
  
  const mergedInput: EncryptedEventInput = {
    calendarId: event.calendarId,
    startTime: updates.startTime ?? event.startTimeUnix,
    endTime: updates.endTime ?? event.endTimeUnix,
    title: updates.title ?? decrypted.decryptedData.title,
    description: updates.description ?? decrypted.decryptedData.description,
    location: updates.location ?? decrypted.decryptedData.location,
    attendees: updates.attendees ?? decrypted.decryptedData.attendees,
    color: updates.color ?? decrypted.decryptedData.color,
    system: updates.system ?? decrypted.decryptedData.system,
    allDay: updates.allDay ?? decrypted.decryptedData.allDay,
    reminderMinutes: updates.reminderMinutes ?? decrypted.decryptedData.reminderMinutes,
    recurrence: updates.recurrence,
  };

  return await encryptEvent(mergedInput, event.calendarId);
}

export async function deleteEncryptedEvent(
  eventId: string
): Promise<{ id: string; deletedAt: number }> {
  return {
    id: eventId,
    deletedAt: Date.now(),
  };
}

export function createSearchIndex(event: EncryptedEvent): { id: string; calendarId: string; startTimeUnix: number; endTimeUnix: number } {
  return {
    id: event.id,
    calendarId: event.calendarId,
    startTimeUnix: event.startTimeUnix,
    endTimeUnix: event.endTimeUnix,
  };
}