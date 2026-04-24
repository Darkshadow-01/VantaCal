/**
 * Timezone-aware event utilities
 *
 * Core principle: Store all events in UTC, display in user's local timezone.
 * - When creating: capture the user's timezone and convert local time → UTC
 * - When displaying: convert UTC → user's current timezone
 * - When traveling: events stay at correct absolute time, just display differently
 */

import { CalendarEvent } from '../event';
import { TimezoneService } from '../services/TimezoneService';

/**
 * Convert a local time in a specific timezone to UTC timestamp
 */
export function localToUTC(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  timezone: string
): number {
  // Create date in the target timezone
  const localString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  // Use Intl to get the offset
  const date = new Date(localString);
  const offset = TimezoneService.getOffset(date, timezone);

  // Adjust for the timezone offset
  return date.getTime() - (offset * 60 * 60 * 1000);
}

/**
 * Convert UTC timestamp to local time components in a specific timezone
 */
export function utcToLocal(
  utcTimestamp: number,
  timezone: string
): { year: number; month: number; day: number; hour: number; minute: number } {
  const date = new Date(utcTimestamp);

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const getPart = (type: string) => {
    const part = parts.find(p => p.type === type);
    return part ? parseInt(part.value, 10) : 0;
  };

  return {
    year: getPart('year'),
    month: getPart('month') - 1, // JS months are 0-indexed
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
}

/**
 * Prepare an event for storage - ensure times are in UTC
 */
export function prepareEventForStorage(
  event: Partial<CalendarEvent> & { startTime: number; endTime?: number },
  userTimezone: string
): CalendarEvent {
  const startTimezone = event.startTimezone || userTimezone;

  // If the event already has timezone info, assume times are already UTC
  // If not, the times were created in user's timezone and need conversion
  if (!event.startTimezone) {
    // Convert from local to UTC
    const startLocal = utcToLocal(event.startTime, userTimezone);
    const startUTC = localToUTC(
      startLocal.year,
      startLocal.month,
      startLocal.day,
      startLocal.hour,
      startLocal.minute,
      userTimezone
    );

    let endTimeUTC: number | undefined;
    if (event.endTime) {
      const endLocal = utcToLocal(event.endTime, userTimezone);
      endTimeUTC = localToUTC(
        endLocal.year,
        endLocal.month,
        endLocal.day,
        endLocal.hour,
        endLocal.minute,
        userTimezone
      );
    }

    return {
      ...event,
      startTime: startUTC,
      endTime: endTimeUTC,
      startTimezone,
    } as CalendarEvent;
  }

  // Timezone already set, times should already be UTC
  return event as CalendarEvent;
}

/**
 * Prepare an event for display in a specific timezone
 * Returns the event with times converted for display
 */
export function prepareEventForDisplay(
  event: CalendarEvent,
  displayTimezone: string
): {
  displayStart: Date;
  displayEnd?: Date;
  event: CalendarEvent
} {
  // For all-day events, just return as-is
  if (event.allDay) {
    return {
      displayStart: new Date(event.startTime),
      displayEnd: event.endTime ? new Date(event.endTime) : undefined,
      event,
    };
  }

  // Convert UTC to display timezone
  // The Date object automatically displays in the browser's local timezone
  const displayStart = new Date(event.startTime);
  const displayEnd = event.endTime ? new Date(event.endTime) : undefined;

  return {
    displayStart,
    displayEnd,
    event,
  };
}

/**
 * Get event time for display - converts UTC to viewer's timezone
 * Use this instead of new Date(event.startTime) directly
 */
export function getDisplayTime(
  event: CalendarEvent,
  userTimezone: string
): { start: Date; end?: Date } {
  const tz = event.startTimezone || userTimezone;
  const local = utcToLocal(event.startTime, tz);
  const start = new Date(local.year, local.month, local.day, local.hour, local.minute);
  
  let end: Date | undefined;
  if (event.endTime) {
    const endLocal = utcToLocal(event.endTime, tz);
    end = new Date(endLocal.year, endLocal.month, endLocal.day, endLocal.hour, endLocal.minute);
  }
  
  return { start, end };
}

/**
 * Format an event's start time for display in the user's current timezone
 * Uses Intl.DateTimeFormat for proper timezone handling
 */
export function formatEventTime(
  event: CalendarEvent,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const formatOptions = options || defaultOptions;

  // For all-day events, return date only
  if (event.allDay) {
    return new Date(event.startTime).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  }

  return new Date(event.startTime).toLocaleTimeString('en-US', formatOptions);
}

/**
 * Get event start/end times as Date objects for display
 * These Date objects will automatically render in the browser's local timezone
 */
export function getEventDisplayTimes(event: CalendarEvent): { start: Date; end?: Date } {
  return {
    start: new Date(event.startTime),
    end: event.endTime ? new Date(event.endTime) : undefined,
  };
}

/**
 * Get the effective timezone for an event
 * Uses event's stored timezone, falling back to user's current timezone
 */
export function getEventTimezone(
  event: CalendarEvent,
  userTimezone: string
): string {
  return event.startTimezone || userTimezone;
}

/**
 * Check if an event time will display differently in another timezone
 * Useful for warning users about cross-timezone scheduling
 */
export function willTimeDrift(
  event: CalendarEvent,
  fromTimezone: string,
  toTimezone: string
): boolean {
  if (fromTimezone === toTimezone) {
    return false;
  }

  if (event.allDay) {
    // All-day events are date-based, not time-based
    // They might shift by a day depending on timezone
    const startLocal = utcToLocal(event.startTime, fromTimezone);
    const endLocal = utcToLocal(event.startTime, toTimezone);

    return startLocal.day !== endLocal.day ||
           startLocal.month !== endLocal.month ||
           startLocal.year !== endLocal.year;
  }

  // Timed events: compare the local time components
  const fromLocal = utcToLocal(event.startTime, fromTimezone);
  const toLocal = utcToLocal(event.startTime, toTimezone);

  return fromLocal.hour !== toLocal.hour ||
         fromLocal.minute !== toLocal.minute;
}

/**
 * Migrate legacy events (without timezone) to timezone-aware format
 * Call this once for existing events when deploying the fix
 */
export function migrateLegacyEvent(
  event: CalendarEvent,
  assumedTimezone: string
): CalendarEvent {
  if (event.startTimezone) {
    // Already migrated
    return event;
  }

  // Assume the event was created in the user's timezone at that time
  // The stored timestamp is already "correct" for that timezone
  // We just need to record what timezone that was
  return {
    ...event,
    startTimezone: assumedTimezone,
  };
}

/**
 * Batch migrate all legacy events
 * Returns the migrated events array
 */
export function migrateLegacyEvents(
  events: CalendarEvent[],
  defaultTimezone: string
): CalendarEvent[] {
  return events.map(event => migrateLegacyEvent(event, defaultTimezone));
}

/**
 * Hook-like utility for React components to get display-ready events
 * Converts UTC-stored events to display times in user's current timezone
 */
export function useDisplayEvents(
  events: CalendarEvent[],
  userTimezone?: string
): CalendarEvent[] {
  // In browser, Date automatically uses the system timezone
  // No conversion needed - just ensure events have timezone metadata
  const defaultTz = typeof window !== 'undefined'
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : 'UTC';

  const tz = userTimezone || defaultTz;

  // Migrate any events without timezone metadata
  return events.map(event => migrateLegacyEvent(event, tz));
}
