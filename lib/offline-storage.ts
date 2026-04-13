const DB_NAME = "vancal-offline";
const DB_VERSION = 2;
const EVENTS_STORE = "events";
const SYNC_QUEUE_STORE = "syncQueue";
const SHARED_CALENDARS_STORE = "sharedCalendars";
const SHARED_WITH_STORE = "sharedWith";

export type CalendarPermission = "view" | "edit" | "admin";

export interface SharedCalendar {
  id: string;
  calendarId: string;
  ownerId: string;
  ownerName: string;
  name: string;
  color: string;
  permission: CalendarPermission;
  accepted: boolean;
  createdAt: number;
}

export interface SharedWithEntry {
  id: string;
  calendarId: string;
  email: string;
  permission: CalendarPermission;
  status: "pending" | "accepted" | "declined";
  invitedAt: number;
  respondedAt?: number;
}

import type { CalendarEvent as DomainCalendarEvent } from "@/src/domain/calendar/event";

export type CalendarEvent = DomainCalendarEvent & {
  synced?: boolean;
};

interface SyncQueueItem {
  id?: number;
  action: "create" | "update" | "delete";
  eventId: string;
  event?: CalendarEvent;
  timestamp: number;
  retryCount: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<IDBDatabase> | null = null;

  constructor() {
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbReady) return this.dbReady;
    
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("IndexedDB not available"));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(EVENTS_STORE)) {
          const eventStore = db.createObjectStore(EVENTS_STORE, { keyPath: "id" });
          eventStore.createIndex("date", "date", { unique: false });
          eventStore.createIndex("month", "month", { unique: false });
          eventStore.createIndex("year", "year", { unique: false });
          eventStore.createIndex("synced", "synced", { unique: false });
        }

        if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
          const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, { 
            keyPath: "id", 
            autoIncrement: true 
          });
          syncStore.createIndex("timestamp", "timestamp", { unique: false });
        }

        if (!db.objectStoreNames.contains(SHARED_CALENDARS_STORE)) {
          const sharedCalStore = db.createObjectStore(SHARED_CALENDARS_STORE, { keyPath: "id" });
          sharedCalStore.createIndex("calendarId", "calendarId", { unique: false });
          sharedCalStore.createIndex("ownerId", "ownerId", { unique: false });
        }

        if (!db.objectStoreNames.contains(SHARED_WITH_STORE)) {
          const sharedWithStore = db.createObjectStore(SHARED_WITH_STORE, { keyPath: "id" });
          sharedWithStore.createIndex("calendarId", "calendarId", { unique: false });
          sharedWithStore.createIndex("email", "email", { unique: false });
        }
      };
    });
  }

  async getDB(): Promise<IDBDatabase> {
    if (!this.dbReady) {
      this.dbReady = this.initDB();
    }
    return this.dbReady;
  }

  async saveEvent(event: CalendarEvent): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.put({ ...event, synced: false });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async saveEvents(events: CalendarEvent[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);

      events.forEach(event => {
        store.put({ ...event, synced: false });
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readonly");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getAllEvents(): Promise<CalendarEvent[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readonly");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
      const results = request.result as CalendarEvent[];
      resolve(results.filter(e => !e.deleted));
    };
    });
  }

  async getUnsyncedEvents(): Promise<CalendarEvent[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readonly");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result as CalendarEvent[];
        resolve(results.filter(e => !e.synced));
      };
    });
  }

  async deleteEvent(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const event = getRequest.result;
        if (event) {
          const deleteRequest = store.put({ ...event, deleted: true, synced: false });
          deleteRequest.onerror = () => reject(deleteRequest.error);
          deleteRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async hardDeleteEvent(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async markEventSynced(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE], "readwrite");
      const store = transaction.objectStore(EVENTS_STORE);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const event = getRequest.result;
        if (event) {
          const updateRequest = store.put({ ...event, synced: true });
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async addToSyncQueue(item: Omit<SyncQueueItem, "id">): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], "readwrite");
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.add(item);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], "readonly");
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async removeSyncQueueItem(id: number): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SYNC_QUEUE_STORE], "readwrite");
      const store = transaction.objectStore(SYNC_QUEUE_STORE);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE, SYNC_QUEUE_STORE], "readwrite");
      const eventStore = transaction.objectStore(EVENTS_STORE);
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE);
      
      eventStore.clear();
      syncStore.clear();
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getStorageUsage(): Promise<{ events: number; syncQueue: number }> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([EVENTS_STORE, SYNC_QUEUE_STORE], "readonly");
      const eventStore = transaction.objectStore(EVENTS_STORE);
      const syncStore = transaction.objectStore(SYNC_QUEUE_STORE);
      
      let eventsCount = 0;
      let syncCount = 0;
      
      eventStore.count().onsuccess = () => { eventsCount = eventStore.count().result; };
      syncStore.count().onsuccess = () => { syncCount = syncStore.count().result; };
      
      transaction.oncomplete = () => resolve({ events: eventsCount, syncQueue: syncCount });
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveSharedCalendar(calendar: SharedCalendar): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_CALENDARS_STORE], "readwrite");
      const store = transaction.objectStore(SHARED_CALENDARS_STORE);
      const request = store.put(calendar);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSharedCalendars(): Promise<SharedCalendar[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_CALENDARS_STORE], "readonly");
      const store = transaction.objectStore(SHARED_CALENDARS_STORE);
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async getSharedCalendarById(id: string): Promise<SharedCalendar | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_CALENDARS_STORE], "readonly");
      const store = transaction.objectStore(SHARED_CALENDARS_STORE);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async deleteSharedCalendar(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_CALENDARS_STORE], "readwrite");
      const store = transaction.objectStore(SHARED_CALENDARS_STORE);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async inviteToCalendar(invitation: SharedWithEntry): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_WITH_STORE], "readwrite");
      const store = transaction.objectStore(SHARED_WITH_STORE);
      const request = store.put(invitation);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getInvitations(calendarId: string): Promise<SharedWithEntry[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_WITH_STORE], "readonly");
      const store = transaction.objectStore(SHARED_WITH_STORE);
      const index = store.index("calendarId");
      const request = index.getAll(calendarId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async updateInvitationStatus(id: string, status: "pending" | "accepted" | "declined"): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([SHARED_WITH_STORE], "readwrite");
      const store = transaction.objectStore(SHARED_WITH_STORE);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const invitation = getRequest.result;
        if (invitation) {
          invitation.status = status;
          invitation.respondedAt = Date.now();
          const updateRequest = store.put(invitation);
          updateRequest.onerror = () => reject(updateRequest.error);
          updateRequest.onsuccess = () => resolve();
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
export type { SyncQueueItem };
