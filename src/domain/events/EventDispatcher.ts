import type { DomainEvent, EventHandler, EventHandlerMap, DomainEventMetadata } from "./DomainEvent";

type AsyncEventHandler = (event: DomainEvent) => Promise<void>;

export class EventDispatcher {
  private handlers: EventHandlerMap = {};
  private middlewares: Array<(event: DomainEvent, next: () => Promise<void>) => Promise<void>> = [];

  subscribe(eventType: string, handler: EventHandler): () => void {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }
    this.handlers[eventType].push(handler);

    return () => {
      this.handlers[eventType] = this.handlers[eventType].filter((h) => h !== handler);
    };
  }

  subscribeToAll(handler: EventHandler): () => void {
    const allHandler: EventHandler = {
      handle: async (event: DomainEvent) => {
        const handlers = this.getHandlers(event.eventType);
        for (const h of handlers) {
          await h.handle(event);
        }
      },
    };

    const allEventType = "*";
    if (!this.handlers[allEventType]) {
      this.handlers[allEventType] = [];
    }
    this.handlers[allEventType].push(allHandler);

    return () => {
      this.handlers[allEventType] = this.handlers[allEventType].filter((h) => h !== allHandler);
    };
  }

  use(middleware: (event: DomainEvent, next: () => Promise<void>) => Promise<void>): void {
    this.middlewares.push(middleware);
  }

  async dispatch<T>(event: DomainEvent<T>): Promise<void> {
    const handlers = this.getHandlers(event.eventType);

    const pipeline = async (): Promise<void> => {
      for (const handler of handlers) {
        await handler.handle(event);
      }
    };

    if (this.middlewares.length === 0) {
      await pipeline();
      return;
    }

    let index = -1;
    const dispatchMiddleware = async (): Promise<void> => {
      index++;
      if (index >= this.middlewares.length) {
        await pipeline();
        return;
      }
      const middleware = this.middlewares[index];
      await middleware(event, dispatchMiddleware);
    };

    await dispatchMiddleware();
  }

  private getHandlers(eventType: string): EventHandler[] {
    const handlers = this.handlers[eventType] || [];
    const allHandlers = this.handlers["*"] || [];
    return [...allHandlers, ...handlers];
  }

  clear(): void {
    this.handlers = {};
  }

  getHandlerCount(eventType: string): number {
    return this.getHandlers(eventType).length;
  }
}

const globalDispatcher = new EventDispatcher();

export function getEventDispatcher(): EventDispatcher {
  return globalDispatcher;
}

export function dispatchEvent<T>(event: DomainEvent<T>): Promise<void> {
  return globalDispatcher.dispatch(event);
}

export function subscribeToEvent(
  eventType: string,
  handler: EventHandler
): () => void {
  return globalDispatcher.subscribe(eventType, handler);
}

export function subscribeToAllEvents(handler: EventHandler): () => void {
  return globalDispatcher.subscribeToAll(handler);
}