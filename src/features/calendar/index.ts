// Calendar Feature - Public API
// Types from domain (canonical source)
export type { 
  CalendarEvent, 
  RecurrenceConfig, 
  RecurrenceType,
  Calendar, 
  ViewType, 
  Settings, 
  SyncStatus, 
  CalendarPermission, 
  SharedCalendar, 
  TodayDate,
  EventInput
} from "@/src/domain/calendar/event";

export { DEFAULT_SETTINGS, DEFAULT_CALENDARS } from "@/src/domain/calendar/event";

// Services
export { expandRecurringEvents, getEventsForDate, type EventWithRecurrence, type RecurrenceConfig as RecurrenceServiceConfig } from "./service/recurrence";

export { detectConflicts, type ConflictInfo } from "./service/conflict-detection";

// Hooks
export { useCalendarEvents, useCalendarEventsBase, type UseCalendarEventsState } from "./hooks/useCalendarEvents";
