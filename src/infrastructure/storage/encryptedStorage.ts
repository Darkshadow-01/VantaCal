import { encryptStringAsync, decryptStringAsync, hasEncryptionKey, setEncryptionKey } from "../encryption/crypto";
import { onVaultUnlock as registerVaultUnlock } from "@/lib/e2ee";
import { normalizeEvent, type CalendarEvent } from "@/src/domain/calendar/event";

const STORAGE_KEY = "encrypted_events_v1";
const TEMP_EVENTS_KEY = "temp_calendar_events";
const QUEUE_KEY = "sync_queue_v1";
const MIGRATION_KEY = "migration_version";
const VAULT_STATE_KEY = "vault_state";

const CURRENT_MIGRATION_VERSION = 2;

export type VaultState = "LOCKED" | "UNLOCKED" | "NO_KEY";

export type { VaultState as VaultStateType };

let cachedVaultState: VaultState | null = null;
let memoryCache: CalendarEvent[] | null = null;
let isInitialized = false;
let unlockHandlerRegistered = false;
let migrationInProgress = false;
let migrationCompleted = false;

function getVaultStateFromStorage(): VaultState {
  if (cachedVaultState !== null) return cachedVaultState;
  
  const stored = localStorage.getItem(VAULT_STATE_KEY);
  if (stored === "UNLOCKED" || stored === "LOCKED" || stored === "NO_KEY") {
    cachedVaultState = stored;
    return stored;
  }
  return "NO_KEY";
}

function setVaultState(state: VaultState): void {
  cachedVaultState = state;
  localStorage.setItem(VAULT_STATE_KEY, state);
}

function hasEncryptionAvailable(): boolean {
  return hasEncryptionKey();
}

export function getVaultState(): VaultState {
  if (!isInitialized) {
    return getVaultStateFromStorage();
  }
  return getVaultStateFromStorage();
}

export async function initializeVault(): Promise<VaultState> {
  isInitialized = true;
  
  if (!unlockHandlerRegistered) {
    unlockHandlerRegistered = true;
    registerVaultUnlock(async () => {
      await onVaultUnlock();
    });
  }
  
  if (hasEncryptionKey()) {
    setVaultState("UNLOCKED");
    await setEncryptionKey();
    await migrateTempEvents();
    return "UNLOCKED";
  }
  
  setVaultState("NO_KEY");
  return "NO_KEY";
}

export async function onVaultUnlock(): Promise<void> {
  setVaultState("UNLOCKED");
  
  await setEncryptionKey();
  await migrateTempEvents();
}

async function migrateTempEvents(): Promise<void> {
  if (migrationCompleted || migrationInProgress) {
    return;
  }
  
  migrationInProgress = true;
  
  try {
    const tempData = sessionStorage.getItem(TEMP_EVENTS_KEY);
    
    if (!tempData) {
      migrationCompleted = true;
      return;
    }
    
    const sessionEvents: CalendarEvent[] = JSON.parse(tempData);
    
    if (!Array.isArray(sessionEvents) || sessionEvents.length === 0) {
      migrationCompleted = true;
      return;
    }
    
    // Check if encrypted store has newer data - only migrate if session is newer
    const encryptedDataTimestamp = sessionEvents.reduce(
      (max, e) => Math.max(max, e.updatedAt || 0),
      0
    );
    
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const decrypted = await decryptStringAsync(JSON.parse(stored));
        const existingData: StoredEvents = JSON.parse(decrypted);
        const existingTimestamp = existingData.events.reduce(
          (max, e) => Math.max(max, e.updatedAt || 0),
          0
        );
        
        if (existingTimestamp >= encryptedDataTimestamp) {
          // Encrypted store is newer or equal - just clear session, don't overwrite
          sessionStorage.removeItem(TEMP_EVENTS_KEY);
          migrationCompleted = true;
          return;
        }
      } catch {
        // Decryption failed - proceed with migration using session data
      }
    }
    
    // Merge and deduplicate events
    const mergedEvents = deduplicateAndSortEvents(sessionEvents);
    
    const data: StoredEvents = {
      events: mergedEvents,
      version: 1,
      lastUpdated: Date.now(),
    };
    
    const encrypted = await encryptStringAsync(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    
    sessionStorage.removeItem(TEMP_EVENTS_KEY);
    migrationCompleted = true;
    console.warn("Migrated temp events to encrypted storage on vault unlock");
  } catch (error) {
    console.error("Failed to migrate temp events:", error);
  } finally {
    migrationInProgress = false;
  }
}

function deduplicateAndSortEvents(events: CalendarEvent[]): CalendarEvent[] {
  const seen = new Map<string, CalendarEvent>();
  
  for (const event of events) {
    const existing = seen.get(event.id);
    
    if (!existing) {
      seen.set(event.id, event);
    } else if (event.version > existing.version) {
      // Higher version wins
      seen.set(event.id, event);
    } else if (event.version === existing.version && event.updatedAt > (existing.updatedAt || 0)) {
      // Same version but newer timestamp wins
      seen.set(event.id, event);
    }
  }
  
  // Sort by startTime for stable ordering
  return Array.from(seen.values()).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
}

function shouldMigrate(): boolean {
  const version = localStorage.getItem(MIGRATION_KEY);
  return !version || parseInt(version, 10) < CURRENT_MIGRATION_VERSION;
}

function markMigrated(): void {
  localStorage.setItem(MIGRATION_KEY, String(CURRENT_MIGRATION_VERSION));
}

interface LegacyEventFormat {
  id: string;
  title: string;
  description?: string;
  date?: number;
  month?: number;
  year?: number;
  hour?: number;
  startTime?: number;
  endTime?: number;
  allDay?: boolean;
  calendarId?: string;
  color?: string;
  type?: string;
  system?: "Health" | "Work" | "Relationships";
  completed?: boolean;
  location?: string;
  recurrence?: string;
  deleted?: boolean;
  version?: number;
  updatedAt?: number;
}

function migrateLegacyEvent(oldEvent: LegacyEventFormat, now: number): CalendarEvent {
  return normalizeEvent({
    ...oldEvent,
    ...(oldEvent.startTime === undefined && oldEvent.year !== undefined && oldEvent.month !== undefined && oldEvent.date !== undefined
      ? {
          startTime: new Date(
            oldEvent.year,
            oldEvent.month,
            oldEvent.date,
            oldEvent.hour || 10
          ).getTime(),
        }
      : {}),
  }) as CalendarEvent;
}

export interface StoredEvents {
  events: CalendarEvent[];
  version: number;
  lastUpdated: number;
}

export async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    // First check if encryption is available
    if (!hasEncryptionAvailable()) {
      console.warn("Vault is locked, using memory-only mode");
      setVaultState("NO_KEY");
      
      const tempData = sessionStorage.getItem(TEMP_EVENTS_KEY);
      if (tempData) {
        try {
          const parsed = JSON.parse(tempData);
          memoryCache = deduplicateAndSortEvents(Array.isArray(parsed) ? parsed : []);
          return memoryCache;
        } catch {
          return [];
        }
      }
      return [];
    }

    setVaultState("UNLOCKED");
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      memoryCache = [];
      return [];
    }

    let decrypted: string;
    try {
      decrypted = await decryptStringAsync(JSON.parse(stored));
    } catch (decryptError) {
      console.error("Decryption failed - data may be corrupt:", decryptError);
      setVaultState("NO_KEY");
      return [];
    }

    let data: StoredEvents;
    try {
      data = JSON.parse(decrypted);
    } catch (parseError) {
      console.error("Failed to parse stored data - invalid JSON:", parseError);
      setVaultState("NO_KEY");
      return [];
    }
    
    let events = deduplicateAndSortEvents(data.events || []);
    
    if (shouldMigrate() && events.length > 0) {
      const now = Date.now();
      const migrated: CalendarEvent[] = [];
      
      for (const oldEvent of events) {
        const legacyCheck = oldEvent as unknown as LegacyEventFormat;
        const needsMigration = !legacyCheck.startTime && (legacyCheck.year !== undefined || legacyCheck.date !== undefined);
        
        if (needsMigration) {
          if (legacyCheck.year !== undefined && legacyCheck.month !== undefined && legacyCheck.date !== undefined) {
            migrated.push(migrateLegacyEvent(legacyCheck, now));
          } else {
            migrated.push(oldEvent);
          }
        } else {
          migrated.push(oldEvent);
        }
      }
      
      try {
        events = migrated;
        await saveEvents(events);
        markMigrated();
      } catch (migrationError) {
        console.error("Migration failed, will retry on next load:", migrationError);
        events = events;
      }
    }
    
    memoryCache = events;
    return events;
  } catch (error) {
    console.error("Failed to load events - safe fallback:", error);
    setVaultState("NO_KEY");
    
    const tempData = sessionStorage.getItem(TEMP_EVENTS_KEY);
    if (tempData) {
      try {
        const parsed = JSON.parse(tempData);
        memoryCache = deduplicateAndSortEvents(Array.isArray(parsed) ? parsed : []);
        return memoryCache;
      } catch {
        return [];
      }
    }
    return [];
  }
}

export async function saveEvents(events: CalendarEvent[]): Promise<void> {
  try {
    const data: StoredEvents = {
      events,
      version: 1,
      lastUpdated: Date.now(),
    };

    // If encryption not available, save ONLY to sessionStorage (temporary, NOT persistent)
    if (!hasEncryptionAvailable()) {
      console.warn("Vault locked - saving to sessionStorage only (temporary)");
      sessionStorage.setItem(TEMP_EVENTS_KEY, JSON.stringify(events));
      memoryCache = events;
      return;
    }

    const encrypted = await encryptStringAsync(JSON.stringify(data));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
    memoryCache = events;
  } catch (error) {
    console.error("Failed to save encrypted events:", error);
    // Try fallback to sessionStorage only (NOT persistent localStorage)
    try {
      console.warn("Using sessionStorage fallback - data will be lost on close");
      sessionStorage.setItem(TEMP_EVENTS_KEY, JSON.stringify(events));
      memoryCache = events;
    } catch {
      console.error("Failed to save fallback events:", error);
      memoryCache = events;
    }
  }
}

export async function addEvent(event: CalendarEvent): Promise<void> {
  const events = await loadEvents();
  events.push(event);
  await saveEvents(events);
}

export async function updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
  const events = await loadEvents();
  const index = events.findIndex(e => e.id === eventId);
  if (index !== -1) {
    events[index] = { ...events[index], ...updates };
    await saveEvents(events);
  }
}

export async function deleteEvent(eventId: string): Promise<void> {
  const events = await loadEvents();
  const filtered = events.filter(e => e.id !== eventId);
  await saveEvents(filtered);
}

export interface SyncQueueItem {
  id: string;
  type: "create" | "update" | "delete";
  eventId: string;
  event: CalendarEvent | null;
  version: number;
  timestamp: number;
  retries: number;
}

export async function loadSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const stored = localStorage.getItem(QUEUE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn("Sync queue corrupted, resetting");
      localStorage.removeItem(QUEUE_KEY);
      return [];
    }
    
    const validQueue: SyncQueueItem[] = [];
    for (const item of parsed) {
      if (item && typeof item.id === "string" && typeof item.type === "string") {
        validQueue.push(item);
      }
    }
    
    return deduplicateQueue(validQueue);
  } catch (error) {
    console.error("Failed to load sync queue:", error);
    localStorage.removeItem(QUEUE_KEY);
    return [];
  }
}

function deduplicateQueue(queue: SyncQueueItem[]): SyncQueueItem[] {
  const seen = new Set<string>();
  const deduped: SyncQueueItem[] = [];
  
  for (const item of queue) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      deduped.push(item);
    }
  }
  
  return deduped;
}

export async function saveSyncQueue(queue: SyncQueueItem[]): Promise<void> {
  try {
    const validQueue = deduplicateQueue(queue);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
  } catch (error) {
    console.error("Failed to save sync queue:", error);
    localStorage.removeItem(QUEUE_KEY);
  }
}

export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  const queue = await loadSyncQueue();
  
  const existingIndex = queue.findIndex(q => q.id === item.id);
  if (existingIndex >= 0) {
    queue[existingIndex] = item;
  } else {
    queue.push(item);
  }
  
  await saveSyncQueue(queue);
}

export async function removeFromSyncQueue(itemId: string): Promise<void> {
  const queue = await loadSyncQueue();
  const filtered = queue.filter(item => item.id !== itemId);
  await saveSyncQueue(filtered);
}

export function mergeConflict(local: CalendarEvent, incoming: CalendarEvent): CalendarEvent {
  if (incoming.version > local.version) {
    return incoming;
  }
  return local;
}

export async function mergeEvents(localEvents: CalendarEvent[], incomingEvents: CalendarEvent[]): Promise<CalendarEvent[]> {
  const merged = new Map<string, CalendarEvent>();
  
  for (const event of localEvents) {
    merged.set(event.id, event);
  }
  
  for (const incoming of incomingEvents) {
    const existing = merged.get(incoming.id);
    if (existing) {
      merged.set(incoming.id, mergeConflict(existing, incoming));
    } else {
      merged.set(incoming.id, incoming);
    }
  }
  
  return Array.from(merged.values());
}

export async function clearSyncQueue(): Promise<void> {
  localStorage.removeItem(QUEUE_KEY);
}

export async function getEventById(eventId: string): Promise<CalendarEvent | null> {
  const events = await loadEvents();
  return events.find(e => e.id === eventId) || null;
}

export async function getEventsByDateRange(start: number, end: number): Promise<CalendarEvent[]> {
  const events = await loadEvents();
  return events.filter(e => 
    e.startTime >= start && 
    e.startTime <= end && 
    !e.deleted
  );
}