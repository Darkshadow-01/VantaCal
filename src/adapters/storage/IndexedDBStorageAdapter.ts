import type { IStoragePort } from "@/src/domain/calendar/interfaces/IStoragePort";
import type { CalendarEvent } from "@/src/domain/calendar/event";

const DB_NAME = "vancal-clean";
const DB_VERSION = 1;
const EVENTS_STORE = "events";

class IndexedDBStorageAdapter implements IStoragePort {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          db.createObjectStore(EVENTS_STORE, { keyPath: "id" });
        }
      };
    });
  }

  async getEvents(): Promise<CalendarEvent[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readonly");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEvent(id: string): Promise<CalendarEvent | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readonly");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.put(event);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getUnsyncedEvents(): Promise<CalendarEvent[]> {
    const events = await this.getEvents();
    return events.filter((e) => !(e as CalendarEvent & { synced?: boolean }).synced);
  }

  async markEventSynced(id: string): Promise<void> {
    const event = await this.getEvent(id);
    if (event) {
      await this.saveEvent({ ...event, synced: true } as CalendarEvent);
    }
  }

  async clearAll(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageUsage(): Promise<{ used: number; percentage: number }> {
    const events = await this.getEvents();
    const size = JSON.stringify(events).length;
    const maxSize = 5 * 1024 * 1024;
    return {
      used: size,
      percentage: Math.min(100, (size / maxSize) * 100),
    };
  }
}

let storageInstance: IStoragePort | null = null;

export function getStorageAdapter(): IStoragePort {
  if (!storageInstance) {
    storageInstance = new IndexedDBStorageAdapter();
  }
  return storageInstance;
}

export { IndexedDBStorageAdapter };