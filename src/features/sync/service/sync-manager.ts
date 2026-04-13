import { offlineStorage } from "@/lib/offline-storage";
import type { CalendarEvent } from "../../calendar/model/types";

type SyncStatus = "idle" | "syncing" | "error" | "offline";
type SyncCallback = (status: SyncStatus, pendingCount?: number) => void;

const CONVEX_URL = typeof window !== "undefined" ? (window as any).__env?.NEXT_PUBLIC_CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL : null;

class SyncManager {
  private status: SyncStatus = "idle";
  private listeners: Set<SyncCallback> = new Set();
  private isOnline: boolean = true;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 3;
  private isConfigured: boolean = !!CONVEX_URL && CONVEX_URL.startsWith("https://");

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
    }
  }

  private setupEventListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners("idle");
      this.sync();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners("offline");
    });

    if ("serviceWorker" in navigator && "sync" in window.ServiceWorkerRegistration.prototype) {
      this.registerBackgroundSync();
    } else {
      this.startPeriodicSync();
    }
  }

  private registerBackgroundSync(): void {
    navigator.serviceWorker.ready.then((registration) => {
      (registration as any).sync.register("sync-events");
    });
  }

  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.status !== "syncing") {
        this.sync();
      }
    }, 30000);
  }

  subscribe(callback: SyncCallback): () => void {
    this.listeners.add(callback);
    callback(this.status);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: SyncStatus, pendingCount?: number): void {
    this.listeners.forEach((callback) => callback(status, pendingCount));
  }

  async getStatus(): Promise<SyncStatus> {
    if (!this.isOnline) return "offline";
    return this.status;
  }

  async getPendingCount(): Promise<number> {
    const queue = await offlineStorage.getSyncQueue();
    const unsynced = await offlineStorage.getUnsyncedEvents();
    return queue.length + unsynced.length;
  }

  async sync(): Promise<boolean> {
    if (!this.isOnline) {
      this.notifyListeners("offline");
      return false;
    }

    if (!this.isConfigured) {
      this.status = "idle";
      this.notifyListeners("idle", 0);
      return true;
    }

    if (this.status === "syncing") {
      return false;
    }

    this.status = "syncing";
    this.notifyListeners("syncing");

    try {
      const queue = await offlineStorage.getSyncQueue();
      
      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeSyncQueueItem(item.id!);
        } catch (error) {
          console.error("Sync item failed:", item, error);
          if (item.retryCount < this.maxRetries) {
            await this.updateRetryCount(item.id!, item.retryCount + 1);
          } else {
            await offlineStorage.removeSyncQueueItem(item.id!);
          }
        }
      }

      const unsyncedEvents = await offlineStorage.getUnsyncedEvents();
      for (const event of unsyncedEvents) {
        try {
          await this.syncEventToServer(event);
          await offlineStorage.markEventSynced(event.id);
        } catch (error) {
          console.error("Event sync failed:", event.id, error);
        }
      }

      this.status = "idle";
      this.notifyListeners("idle");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      this.status = "error";
      this.notifyListeners("error");
      
      this.retryTimeout = setTimeout(() => {
        this.status = "idle";
        this.sync();
      }, 5000);
      
      return false;
    }
  }

  private async processSyncItem(item: any): Promise<void> {
    switch (item.action) {
      case "create":
        await this.syncEventToServer(item.event);
        break;
      case "update":
        await this.updateEventOnServer(item.event);
        break;
      case "delete":
        await this.deleteEventOnServer(item.eventId);
        break;
    }
  }

  private async syncEventToServer(event: CalendarEvent): Promise<void> {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
  }

  private async updateEventOnServer(event: CalendarEvent): Promise<void> {
    const response = await fetch(`/api/events/${event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
  }

  private async deleteEventOnServer(eventId: string): Promise<void> {
    const response = await fetch(`/api/events/${eventId}`, {
      method: "DELETE",
    });
    
    if (!response.ok && response.status !== 404) {
      throw new Error(`Server returned ${response.status}`);
    }
  }

  private async updateRetryCount(id: number, count: number): Promise<void> {
    const queue = await offlineStorage.getSyncQueue();
    const item = queue.find((q) => q.id === id);
    if (item) {
      await offlineStorage.addToSyncQueue({ ...item, retryCount: count });
    }
  }

  async queueEventSync(
    action: "create" | "update" | "delete",
    event: CalendarEvent | null,
    eventId: string
  ): Promise<void> {
    await offlineStorage.addToSyncQueue({
      action,
      eventId,
      event: event || undefined,
      timestamp: Date.now(),
      retryCount: 0,
    });

    if (this.isOnline) {
      this.sync();
    }

    const pendingCount = await this.getPendingCount();
    this.notifyListeners(this.status, pendingCount);
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
    this.listeners.clear();
  }
}

export const syncManager = new SyncManager();