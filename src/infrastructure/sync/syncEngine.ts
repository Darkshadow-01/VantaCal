import type { CalendarEvent } from "../../domain/calendar/event";
import { loadSyncQueue, saveSyncQueue, addToSyncQueue, removeFromSyncQueue, type SyncQueueItem } from "../storage/encryptedStorage";

const MAX_RETRIES = 5;
const MAX_QUEUE_SIZE = 100;
const RETRY_DELAY = 5000;
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export type SyncCallback = (operation: SyncQueueItem) => Promise<boolean>;

let syncCallbacks: SyncCallback[] = [];
let isProcessing = false;
let retryTimeoutId: NodeJS.Timeout | null = null;

export function onSyncOperation(callback: SyncCallback): () => void {
  syncCallbacks.push(callback);
  return () => {
    syncCallbacks = syncCallbacks.filter(cb => cb !== callback);
  };
}

export function enqueueOperation(
  type: "create" | "update" | "delete",
  eventId: string,
  event: CalendarEvent | null,
  version: number
): void {
  const item: SyncQueueItem = {
    id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    eventId,
    event,
    version,
    timestamp: Date.now(),
    retries: 0,
  };

  addToSyncQueue(item);
}

export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const queue = await loadSyncQueue();
    
    // Prevent queue from growing infinitely - drop oldest failed operations if too large
    let workingQueue = [...queue];
    if (workingQueue.length > MAX_QUEUE_SIZE) {
      workingQueue = workingQueue
        .filter(item => item.retries < MAX_RETRIES)
        .slice(-MAX_QUEUE_SIZE);
    }
    
    for (const item of workingQueue) {
      if (item.retries >= MAX_RETRIES) {
        console.warn(`Dropping sync operation after ${MAX_RETRIES} retries: ${item.id}`);
        await removeFromSyncQueue(item.id);
        continue;
      }

      const success = await trySyncOperation(item);
      
      if (success) {
        await removeFromSyncQueue(item.id);
      } else {
        item.retries++;
        item.timestamp = Date.now();
        await saveSyncQueue(workingQueue);
      }
    }

    await saveSyncQueue(workingQueue);
  } catch (error) {
    console.error("Error processing sync queue:", error);
  } finally {
    isProcessing = false;
    
    const remainingQueue = await loadSyncQueue();
    if (remainingQueue.length > 0) {
      scheduleRetry();
    }
  }
}

async function trySyncOperation(item: SyncQueueItem): Promise<boolean> {
  for (const callback of syncCallbacks) {
    try {
      const result = await callback(item);
      if (result) return true;
    } catch (error) {
      console.error(`Sync callback failed for ${item.id}:`, error);
    }
  }

  if (!BACKEND_URL) {
    console.log("No backend URL configured, simulating sync success");
    return true;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    return response.ok;
  } catch (error) {
    console.error("Backend sync failed:", error);
    return false;
  }
}

function scheduleRetry(): void {
  if (retryTimeoutId) return;
  
  retryTimeoutId = setTimeout(() => {
    retryTimeoutId = null;
    processQueue();
  }, RETRY_DELAY);
}

export async function forceSyncNow(): Promise<void> {
  if (retryTimeoutId) {
    clearTimeout(retryTimeoutId);
    retryTimeoutId = null;
  }
  await processQueue();
}

export async function getQueueStatus(): Promise<{ pending: number; failed: number }> {
  const queue = await loadSyncQueue();
  const pending = queue.filter(item => item.retries < MAX_RETRIES).length;
  const failed = queue.filter(item => item.retries >= MAX_RETRIES).length;
  return { pending, failed };
}

export async function clearFailedOperations(): Promise<void> {
  const queue = await loadSyncQueue();
  const active = queue.filter(item => item.retries < MAX_RETRIES);
  await saveSyncQueue(active);
}

export function isSyncing(): boolean {
  return isProcessing;
}