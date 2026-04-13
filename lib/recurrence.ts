// Re-export from canonical location (src/features)
// This file exists for backwards compatibility - use src/features/calendar/service/recurrence.ts directly
export type { EventWithRecurrence, RecurrenceConfig, RecurrenceType } from "@/src/features/calendar/service/recurrence";
export { expandRecurringEvents, getEventsForDate } from "@/src/features/calendar/service/recurrence";