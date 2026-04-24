import { createDomainEvent, createEventMetadata } from "./DomainEvent";
import type { CalendarEvent } from "../calendar/event";

export interface EventCreatedPayload {
  event: CalendarEvent;
  createdBy: string;
}

export interface EventUpdatedPayload {
  event: CalendarEvent;
  previousEvent: CalendarEvent;
  updatedBy: string;
  changes: string[];
}

export interface EventDeletedPayload {
  eventId: string;
  calendarId: string;
  deletedBy: string;
}

export interface ConflictDetectedPayload {
  newEvent: CalendarEvent;
  conflictingEvents: Array<{
    event: CalendarEvent;
    overlapMinutes: number;
  }>;
}

export interface CalendarVisibilityChangedPayload {
  calendarId: string;
  userId: string;
  visible: boolean;
}

export type CalendarEventType =
  | "calendar.event.created"
  | "calendar.event.updated"
  | "calendar.event.deleted"
  | "calendar.conflict.detected"
  | "calendar.visibility.changed";

export const CalendarEvents = {
  EventCreated: "calendar.event.created",
  EventUpdated: "calendar.event.updated",
  EventDeleted: "calendar.event.deleted",
  ConflictDetected: "calendar.conflict.detected",
  CalendarVisibilityChanged: "calendar.visibility.changed",
} as const;

export function createEventCreatedEvent(
  event: CalendarEvent,
  userId: string,
  source: string = "calendar-service"
) {
  return createDomainEvent<EventCreatedPayload>(
    CalendarEvents.EventCreated,
    { event, createdBy: userId },
    createEventMetadata(source, { userId })
  );
}

export function createEventUpdatedEvent(
  event: CalendarEvent,
  previousEvent: CalendarEvent,
  userId: string,
  source: string = "calendar-service"
) {
  const changes: string[] = [];
  if (event.title !== previousEvent.title) changes.push("title");
  if (event.startTime !== previousEvent.startTime) changes.push("startTime");
  if (event.endTime !== previousEvent.endTime) changes.push("endTime");
  if (event.description !== previousEvent.description) changes.push("description");
  if (event.location !== previousEvent.location) changes.push("location");

  return createDomainEvent<EventUpdatedPayload>(
    CalendarEvents.EventUpdated,
    { event, previousEvent, updatedBy: userId, changes },
    createEventMetadata(source, { userId })
  );
}

export function createEventDeletedEvent(
  eventId: string,
  calendarId: string,
  userId: string,
  source: string = "calendar-service"
) {
  return createDomainEvent<EventDeletedPayload>(
    CalendarEvents.EventDeleted,
    { eventId, calendarId, deletedBy: userId },
    createEventMetadata(source, { userId })
  );
}

export function createConflictDetectedEvent(
  newEvent: CalendarEvent,
  conflictingEvents: Array<{ event: CalendarEvent; overlapMinutes: number }>,
  source: string = "conflict-detection"
) {
  return createDomainEvent<ConflictDetectedPayload>(
    CalendarEvents.ConflictDetected,
    { newEvent, conflictingEvents },
    createEventMetadata(source)
  );
}

export function createCalendarVisibilityChangedEvent(
  calendarId: string,
  userId: string,
  visible: boolean,
  source: string = "calendar-ui"
) {
  return createDomainEvent<CalendarVisibilityChangedPayload>(
    CalendarEvents.CalendarVisibilityChanged,
    { calendarId, userId, visible },
    createEventMetadata(source, { userId })
  );
}