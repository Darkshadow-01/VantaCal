// Calendar Feature - Public API
export type { 
  CalendarEvent, 
  CalendarEventType, 
  RecurrenceConfig, 
  Calendar, 
  ViewType, 
  Settings, 
  SyncStatus, 
  CalendarPermission, 
  SharedCalendar, 
  TodayDate 
} from "./model/types";

export { DEFAULT_SETTINGS, DEFAULT_CALENDARS } from "./model/types";

export { expandRecurringEvents, getEventsForDate, type EventWithRecurrence, type RecurrenceType, type RecurrenceConfig as RecurrenceServiceConfig } from "./service/recurrence";

export { detectConflicts, type ConflictInfo } from "./service/conflict-detection";

export { useCalendarEvents, type EventInput } from "./hooks/useCalendarEvents";
