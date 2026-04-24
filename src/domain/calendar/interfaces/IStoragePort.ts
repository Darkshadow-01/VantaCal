import type { CalendarEvent } from "../event";

export interface IStoragePort {
  getEvents(): Promise<CalendarEvent[]>;
  getEvent(id: string): Promise<CalendarEvent | null>;
  saveEvent(event: CalendarEvent): Promise<void>;
  deleteEvent(id: string): Promise<void>;
  getUnsyncedEvents(): Promise<CalendarEvent[]>;
  markEventSynced(id: string): Promise<void>;
  clearAll(): Promise<void>;
  getStorageUsage(): Promise<{ used: number; percentage: number }>;
}