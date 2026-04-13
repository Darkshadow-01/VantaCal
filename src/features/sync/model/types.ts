export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface SyncQueueItem {
  id?: number;
  action: "create" | "update" | "delete";
  eventId: string;
  event?: object;
  timestamp: number;
  retryCount: number;
}