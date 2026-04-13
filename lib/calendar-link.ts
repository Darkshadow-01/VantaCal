/**
 * Calendar Link System
 * Public read-only sharing via shareable links
 */

import { generateRandomBytes, arrayBufferToBase64, base64ToArrayBuffer } from "./e2ee";

const LINK_BYTES = 16;
const IV_LENGTH = 12;

export interface CalendarLinkConfig {
  id: string;
  calendarId: string;
  linkKey: string;
  accessLevel: "read" | "read-write";
  expiresAt?: number;
  maxUses?: number;
  useCount: number;
  createdAt: number;
  createdBy: string;
  title?: string;
  description?: string;
  password?: string;
  allowDownload: boolean;
}

export interface EncryptedCalendarSnapshot {
  id: string;
  calendarId: string;
  encryptedData: string;
  iv: string;
  timestamp: number;
  checksum: string;
}

export interface PublicCalendarLink {
  url: string;
  config: CalendarLinkConfig;
  expiresAt?: number;
}

const calendarLinks = new Map<string, CalendarLinkConfig>();
const linkCounter = new Map<string, number>();

export async function generateCalendarLinkId(): Promise<string> {
  const bytes = await generateRandomBytes(LINK_BYTES);
  return arrayBufferToBase64(bytes)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export async function createCalendarLink(
  calendarId: string,
  accessLevel: "read" | "read-write" = "read",
  createdBy: string,
  options?: {
    expiresAt?: number;
    maxUses?: number;
    title?: string;
    description?: string;
    password?: string;
    allowDownload?: boolean;
  }
): Promise<PublicCalendarLink> {
  const linkKey = await generateCalendarLinkId();

  const config: CalendarLinkConfig = {
    id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    calendarId,
    linkKey,
    accessLevel,
    expiresAt: options?.expiresAt,
    maxUses: options?.maxUses,
    useCount: 0,
    createdAt: Date.now(),
    createdBy,
    title: options?.title,
    description: options?.description,
    password: options?.password,
    allowDownload: options?.allowDownload ?? false,
  };

  calendarLinks.set(linkKey, config);
  linkCounter.set(linkKey, 0);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${baseUrl}/calendar/share/${linkKey}`;

  return { url, config, expiresAt: options?.expiresAt };
}

export function getCalendarLink(linkKey: string): CalendarLinkConfig | null {
  const link = calendarLinks.get(linkKey);
  if (!link) return null;

  if (link.expiresAt && Date.now() > link.expiresAt) {
    deleteCalendarLink(linkKey);
    return null;
  }

  if (link.maxUses && linkCounter.get(linkKey)! >= link.maxUses) {
    deleteCalendarLink(linkKey);
    return null;
  }

  return link;
}

export function validateCalendarLink(linkKey: string): {
  valid: boolean;
  error?: string;
  config?: CalendarLinkConfig;
} {
  const config = getCalendarLink(linkKey);

  if (!config) {
    return { valid: false, error: "Link not found or expired" };
  }

  if (config.expiresAt && Date.now() > config.expiresAt) {
    return { valid: false, error: "Link has expired" };
  }

  if (config.maxUses && (linkCounter.get(linkKey) || 0) >= config.maxUses) {
    return { valid: false, error: "Link has reached maximum uses" };
  }

  return { valid: true, config };
}

export function recordLinkUse(linkKey: string): boolean {
  const config = getCalendarLink(linkKey);
  if (!config) return false;

  const current = linkCounter.get(linkKey) || 0;
  linkCounter.set(linkKey, current + 1);

  config.useCount = current + 1;
  return true;
}

export function getLinkAccessLevel(linkKey: string): "read" | "read-write" | null {
  const config = getCalendarLink(linkKey);
  return config?.accessLevel || null;
}

export function deleteCalendarLink(linkKey: string): boolean {
  calendarLinks.delete(linkKey);
  linkCounter.delete(linkKey);
  return true;
}

export function updateCalendarLink(
  linkKey: string,
  updates: Partial<Omit<CalendarLinkConfig, "id" | "calendarId" | "linkKey" | "createdAt">>
): CalendarLinkConfig | null {
  const config = calendarLinks.get(linkKey);
  if (!config) return null;

  const updated = { ...config, ...updates };
  calendarLinks.set(linkKey, updated);
  return updated;
}

export function getAllLinksForCalendar(calendarId: string): CalendarLinkConfig[] {
  return Array.from(calendarLinks.values()).filter(
    (link) => link.calendarId === calendarId
  );
}

export function revokeExpiredLinks(calendarId: string): number {
  const links = getAllLinksForCalendar(calendarId);
  let revoked = 0;
  const now = Date.now();

  for (const link of links) {
    if (link.expiresAt && link.expiresAt < now) {
      deleteCalendarLink(link.linkKey);
      revoked++;
    } else if (link.maxUses && (linkCounter.get(link.linkKey) || 0) >= link.maxUses) {
      deleteCalendarLink(link.linkKey);
      revoked++;
    }
  }

  return revoked;
}

export async function createEncryptedCalendarSnapshot(
  calendarId: string,
  events: Array<{
    id: string;
    title: string;
    description?: string;
    startTime: number;
    endTime: number;
    allDay: boolean;
    location?: string;
    color?: string;
  }>
): Promise<EncryptedCalendarSnapshot> {
  const data = JSON.stringify(events);
  const dataBytes = new TextEncoder().encode(data);
  const iv = await generateRandomBytes(IV_LENGTH);

  const key = await crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv.buffer as ArrayBuffer },
    key,
    dataBytes
  );

  const keyData = await crypto.subtle.exportKey("raw", key);
  const checksum = await computeChecksum(encrypted);

  const snapshot: EncryptedCalendarSnapshot = {
    id: `snap-${Date.now()}`,
    calendarId,
    encryptedData: arrayBufferToBase64(encrypted),
    iv: arrayBufferToBase64(iv),
    timestamp: Date.now(),
    checksum,
  };

  return snapshot;
}

export async function decryptCalendarSnapshot(
  snapshot: EncryptedCalendarSnapshot,
  password?: string
): Promise<Array<{
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  location?: string;
  color?: string;
}> | null> {
  try {
    const encrypted = base64ToArrayBuffer(snapshot.encryptedData);
    const iv = base64ToArrayBuffer(snapshot.iv);

    if (password) {
      const key = await deriveKeyFromPassword(password);
      const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        encrypted
      );
      const data = new TextDecoder().decode(decrypted);
      return JSON.parse(data) as Array<{
        id: string;
        title: string;
        description?: string;
        startTime: number;
        endTime: number;
        allDay: boolean;
        location?: string;
        color?: string;
      }>;
    }

    return [];
  } catch {
    return [];
  }
}

async function deriveKeyFromPassword(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = new Uint8Array(16);
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function computeChecksum(data: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return arrayBufferToBase64(hashBuffer);
}

export function getLinkStats(linkKey: string): {
  uses: number;
  maxUses: number | null;
  expiresAt: number | null;
  createdAt: number;
} | null {
  const config = getCalendarLink(linkKey);
  if (!config) return null;

  return {
    uses: linkCounter.get(linkKey) || 0,
    maxUses: config.maxUses || null,
    expiresAt: config.expiresAt || null,
    createdAt: config.createdAt,
  };
}

export function generateShareText(
  calendarId: string,
  title?: string
): string {
  const links = getAllLinksForCalendar(calendarId);
  if (links.length === 0) return "";

  const text = [
    `Calendar: ${title || calendarId}`,
    "",
    "Public Links:",
  ];

  for (const link of links) {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    text.push(`- ${link.title || "Link"}: ${baseUrl}/calendar/share/${link.linkKey}`);
    if (link.expiresAt) {
      text.push(`  Expires: ${new Date(link.expiresAt).toLocaleString()}`);
    }
  }

  return text.join("\n");
}