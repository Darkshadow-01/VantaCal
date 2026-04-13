export { 
  type CalendarEvent, 
  type RecurrenceConfig, 
  type RecurrenceType,
  type Calendar, 
  type ViewType, 
  type Settings, 
  type SyncStatus,
  type CalendarPermission,
  type SharedCalendar,
  type TodayDate,
  DEFAULT_SETTINGS,
  DEFAULT_CALENDARS
} from "../../../domain/calendar/event";

export type CalendarEventType = "holiday" | "meeting" | "personal" | "task" | "event" | "reminder";