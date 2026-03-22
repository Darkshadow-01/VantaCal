/**
 * Encrypted local storage for offline mode
 * Stores sensitive data locally with encryption
 */

import { encrypt, decrypt, isEncryptionAvailable, type EncryptedData } from "./encryption";

export interface LocalEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
  synced: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LocalUser {
  id: string;
  email: string;
  name?: string;
  encryptedData?: EncryptedData;
}

export interface CacheMetadata {
  lastSync: number;
  eventCount: number;
  encryptedSize: number;
}

const STORAGE_KEYS = {
  EVENTS: "calendar_events",
  USER: "calendar_user",
  SETTINGS: "calendar_settings",
  META: "calendar_meta",
  SYNC_QUEUE: "calendar_sync_queue",
} as const;

const browserStorage = typeof window !== "undefined" ? window.localStorage : null;

export class EncryptedLocalStorage {
  private isEnabled: boolean = true;
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.isEnabled = isEncryptionAvailable();
  }

  async enableEncryption(): Promise<boolean> {
    if (!this.isEnabled || !browserStorage) return false;
    
    const storedKey = browserStorage.getItem("calendar_key_salt");
    if (!storedKey) {
      const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
      const exported = await crypto.subtle.exportKey("raw", key);
      browserStorage.setItem("calendar_key_salt", btoa(String.fromCharCode(...new Uint8Array(exported))));
      this.encryptionKey = key;
    } else {
      const keyData = Uint8Array.from(atob(storedKey), c => c.charCodeAt(0));
      this.encryptionKey = await crypto.subtle.importKey(
        "raw",
        keyData,
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
      );
    }
    return true;
  }

  disableEncryption(): void {
    this.encryptionKey = null;
  }

  private getKey(): CryptoKey | null {
    return this.encryptionKey;
  }

  async storeEvents(events: LocalEvent[]): Promise<void> {
    if (!browserStorage) return;
    
    const data = JSON.stringify(events);
    
    if (this.encryptionKey) {
      const encrypted = await encrypt(data, this.encryptionKey);
      browserStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(encrypted));
    } else {
      browserStorage.setItem(STORAGE_KEYS.EVENTS, data);
    }

    const meta: CacheMetadata = {
      lastSync: Date.now(),
      eventCount: events.length,
      encryptedSize: browserStorage.getItem(STORAGE_KEYS.EVENTS)?.length || 0,
    };
    browserStorage.setItem(STORAGE_KEYS.META, JSON.stringify(meta));
  }

  async getEvents(): Promise<LocalEvent[]> {
    if (!browserStorage) return [];
    
    const stored = browserStorage.getItem(STORAGE_KEYS.EVENTS);
    if (!stored) return [];

    try {
      if (this.encryptionKey) {
        const encrypted: EncryptedData = JSON.parse(stored);
        const decrypted = await decrypt(encrypted, this.encryptionKey);
        return JSON.parse(decrypted);
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to decrypt events:", error);
      return [];
    }
  }

  async addEvent(event: LocalEvent): Promise<void> {
    const events = await this.getEvents();
    event.id = event.id || crypto.randomUUID();
    event.synced = false;
    event.createdAt = event.createdAt || Date.now();
    event.updatedAt = Date.now();
    events.push(event);
    await this.storeEvents(events);
  }

  async updateEvent(id: string, updates: Partial<LocalEvent>): Promise<void> {
    const events = await this.getEvents();
    const index = events.findIndex(e => e.id === id);
    if (index !== -1) {
      events[index] = {
        ...events[index],
        ...updates,
        synced: false,
        updatedAt: Date.now(),
      };
      await this.storeEvents(events);
    }
  }

  async deleteEvent(id: string): Promise<void> {
    const events = await this.getEvents();
    const filtered = events.filter(e => e.id !== id);
    await this.storeEvents(filtered);
  }

  async getUnsyncedEvents(): Promise<LocalEvent[]> {
    const events = await this.getEvents();
    return events.filter(e => !e.synced);
  }

  async markEventSynced(id: string): Promise<void> {
    await this.updateEvent(id, { synced: true });
  }

  async storeUser(user: LocalUser): Promise<void> {
    if (!browserStorage) return;
    
    const data = JSON.stringify(user);
    
    if (this.encryptionKey) {
      const encrypted = await encrypt(data, this.encryptionKey);
      browserStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(encrypted));
    } else {
      browserStorage.setItem(STORAGE_KEYS.USER, data);
    }
  }

  async getUser(): Promise<LocalUser | null> {
    if (!browserStorage) return null;
    
    const stored = browserStorage.getItem(STORAGE_KEYS.USER);
    if (!stored) return null;

    try {
      if (this.encryptionKey) {
        const encrypted: EncryptedData = JSON.parse(stored);
        const decrypted = await decrypt(encrypted, this.encryptionKey);
        return JSON.parse(decrypted);
      }
      return JSON.parse(stored);
    } catch (error) {
      console.error("Failed to decrypt user data:", error);
      return null;
    }
  }

  setSetting<T>(key: string, value: T): void {
    if (!browserStorage) return;
    const settings = this.getAllSettings();
    settings[key] = value;
    browserStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  getSetting<T>(key: string, defaultValue: T): T {
    const settings = this.getAllSettings();
    return (settings[key] as T) ?? defaultValue;
  }

  private getAllSettings(): Record<string, unknown> {
    if (!browserStorage) return {};
    const stored = browserStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : {};
  }

  getMetadata(): CacheMetadata | null {
    if (!browserStorage) return null;
    const stored = browserStorage.getItem(STORAGE_KEYS.META);
    return stored ? JSON.parse(stored) : null;
  }

  async clearAll(): Promise<void> {
    if (!browserStorage) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      browserStorage.removeItem(key);
    });
    this.encryptionKey = null;
  }

  getStorageUsage(): { used: number; available: number; percentage: number } {
    if (!browserStorage) return { used: 0, available: 5 * 1024 * 1024, percentage: 0 };
    
    let used = 0;
    Object.values(STORAGE_KEYS).forEach(key => {
      const item = browserStorage.getItem(key);
      if (item) used += item.length * 2;
    });

    const available = 5 * 1024 * 1024;
    return {
      used,
      available,
      percentage: Math.round((used / available) * 100),
    };
  }

  isOfflineMode(): boolean {
    return typeof navigator !== "undefined" ? !navigator.onLine : true;
  }

  async syncWithRemote(
    fetchEvents: () => Promise<LocalEvent[]>,
    pushEvents: (events: LocalEvent[]) => Promise<void>
  ): Promise<{ synced: number; conflicts: string[] }> {
    const conflicts: string[] = [];
    let synced = 0;

    try {
      const remoteEvents = await fetchEvents();
      const localEvents = await this.getEvents();
      const unsynced = localEvents.filter(e => !e.synced);

      if (remoteEvents.length > 0) {
        await this.storeEvents(remoteEvents);
        synced += remoteEvents.length;
      }

      if (unsynced.length > 0) {
        await pushEvents(unsynced);
        for (const event of unsynced) {
          await this.markEventSynced(event.id);
          synced++;
        }
      }

      const updatedRemote = await fetchEvents();
      await this.storeEvents(updatedRemote);

    } catch (error) {
      console.error("Sync failed:", error);
    }

    return { synced, conflicts };
  }
}

export const encryptedLocalStorage = new EncryptedLocalStorage();
