export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  occurredAt: Date;
  payload: T;
  metadata?: DomainEventMetadata;
}

export interface DomainEventMetadata {
  correlationId?: string;
  causationId?: string;
  userId?: string;
  sessionId?: string;
  source: string;
}

export interface EventHandler<T = unknown> {
  handle(event: DomainEvent<T>): Promise<void> | void;
}

export type EventHandlerMap = {
  [eventType: string]: EventHandler[];
};

export function createDomainEvent<T>(
  eventType: string,
  payload: T,
  metadata?: DomainEventMetadata
): DomainEvent<T> {
  return {
    eventId: `${eventType}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    eventType,
    occurredAt: new Date(),
    payload,
    metadata,
  };
}

export function createEventMetadata(
  source: string,
  options?: Partial<DomainEventMetadata>
): DomainEventMetadata {
  return {
    source,
    ...options,
  };
}