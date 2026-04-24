import type { DomainEvent, DomainEventMetadata, EventHandler, EventHandlerMap } from "./DomainEvent";
export type { DomainEvent, DomainEventMetadata, EventHandler, EventHandlerMap };

export { EventDispatcher, getEventDispatcher, dispatchEvent, subscribeToEvent, subscribeToAllEvents } from "./EventDispatcher";

export {
  CalendarEvents,
  createEventCreatedEvent,
  createEventUpdatedEvent,
  createEventDeletedEvent,
  createConflictDetectedEvent,
  createCalendarVisibilityChangedEvent,
} from "./CalendarEvents";

export type {
  CalendarEventType,
  EventCreatedPayload,
  EventUpdatedPayload,
  EventDeletedPayload,
  ConflictDetectedPayload,
  CalendarVisibilityChangedPayload,
} from "./CalendarEvents";