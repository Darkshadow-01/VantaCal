/**
 * Test utilities and example tests
 * 
 * To run these tests:
 * 1. Add vitest: npm install -D vitest @vitest/ui
 * 2. Add test script: "test": "vitest"
 * 3. Run: npm test
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { CreateEventUseCase, type CreateEventInput } from "@/src/domain/calendar/useCases/CreateEventUseCase";
import { InMemoryEventRepository } from "@/src/infrastructure/adapters/InMemoryEventRepository";
import { EventDispatcher, subscribeToEvent, dispatchEvent, createEventCreatedEvent } from "@/src/domain/events";
import { EventTime } from "@/src/domain/calendar/valueObjects/EventTime";
import { CalendarColor } from "@/src/domain/calendar/valueObjects/CalendarColor";

describe("CreateEventUseCase", () => {
  let repository: InMemoryEventRepository;
  let useCase: CreateEventUseCase;

  beforeEach(() => {
    repository = new InMemoryEventRepository();
    useCase = new CreateEventUseCase(repository);
  });

  it("should create an event successfully", async () => {
    const input: CreateEventInput = {
      userId: "user-1",
      title: "Team Meeting",
      startTime: Date.now() + 86400000,
      endTime: Date.now() + 86400000 + 3600000,
      allDay: false,
      system: "Work",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(true);
    expect(result.event?.title).toBe("Team Meeting");
    expect(result.event?.system).toBe("Work");
  });

  it("should reject event with empty title", async () => {
    const input: CreateEventInput = {
      userId: "user-1",
      title: "",
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      allDay: false,
      system: "Work",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Event title is required");
  });

  it("should reject event with end time before start time", async () => {
    const input: CreateEventInput = {
      userId: "user-1",
      title: "Test Event",
      startTime: Date.now() + 3600000,
      endTime: Date.now(),
      allDay: false,
      system: "Work",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(false);
    expect(result.error).toBe("End time must be after start time");
  });

  it("should detect conflicts with existing events", async () => {
    await repository.save({
      userId: "user-1",
      title: "Existing Event",
      startTime: Date.now() + 86400000,
      endTime: Date.now() + 86400000 + 3600000,
      allDay: false,
      system: "Work",
    });

    const input: CreateEventInput = {
      userId: "user-1",
      title: "Conflicting Event",
      startTime: Date.now() + 86400000 + 1800000,
      endTime: Date.now() + 86400000 + 5400000,
      allDay: false,
      system: "Work",
    };

    const result = await useCase.execute(input);

    expect(result.success).toBe(false);
    expect(result.conflicts).toBeDefined();
    expect(result.conflicts?.length).toBeGreaterThan(0);
  });
});

describe("EventDispatcher", () => {
  let dispatcher: EventDispatcher;

  beforeEach(() => {
    dispatcher = new EventDispatcher();
  });

  it("should dispatch event to subscribers", async () => {
    const handledEvents: string[] = [];

    dispatcher.subscribe("test.event", {
      handle: async (event) => {
        handledEvents.push(event.eventType);
      },
    });

    await dispatcher.dispatch({
      eventId: "1",
      eventType: "test.event",
      occurredAt: new Date(),
      payload: { data: "test" },
    });

    expect(handledEvents).toContain("test.event");
  });

  it("should allow unsubscribing", async () => {
    const handledEvents: string[] = [];

    const unsubscribe = dispatcher.subscribe("test.event", {
      handle: async (event) => {
        handledEvents.push(event.eventType);
      },
    });

    unsubscribe();

    await dispatcher.dispatch({
      eventId: "1",
      eventType: "test.event",
      occurredAt: new Date(),
      payload: {},
    });

    expect(handledEvents).toHaveLength(0);
  });

  it("should execute middleware in pipeline", async () => {
    const middlewareOrder: string[] = [];

    dispatcher.use(async (event, next) => {
      middlewareOrder.push("middleware1-start");
      await next();
      middlewareOrder.push("middleware1-end");
    });

    dispatcher.use(async (event, next) => {
      middlewareOrder.push("middleware2-start");
      await next();
      middlewareOrder.push("middleware2-end");
    });

    dispatcher.subscribe("test.event", {
      handle: async () => {
        middlewareOrder.push("handler");
      },
    });

    await dispatcher.dispatch({
      eventId: "1",
      eventType: "test.event",
      occurredAt: new Date(),
      payload: {},
    });

    expect(middlewareOrder).toEqual([
      "middleware1-start",
      "middleware2-start",
      "handler",
      "middleware2-end",
      "middleware1-end",
    ]);
  });
});

describe("EventTime Value Object", () => {
  it("should create valid event time", () => {
    const start = Date.now();
    const end = start + 3600000;

    const eventTime = new EventTime(start, end);

    expect(eventTime.start.getTime()).toBe(start);
    expect(eventTime.end?.getTime()).toBe(end);
  });

  it("should reject end before start", () => {
    const start = Date.now();
    const end = start - 3600000;

    expect(() => new EventTime(start, end)).toThrow("End time must be after start time");
  });

  it("should calculate duration", () => {
    const start = Date.now();
    const end = start + 3600000;

    const eventTime = new EventTime(start, end);

    expect(eventTime.durationMinutes).toBe(60);
  });

  it("should detect same day", () => {
    const day1 = new Date(2024, 0, 15, 10, 0);
    const day1End = new Date(2024, 0, 15, 11, 0);
    const day2 = new Date(2024, 0, 15, 14, 0);
    const day2End = new Date(2024, 0, 15, 15, 0);

    const et1 = new EventTime(day1, day1End);
    const et2 = new EventTime(day2, day2End);

    expect(et1.isOnSameDay(et2)).toBe(true);
  });
});

describe("CalendarColor Value Object", () => {
  it("should create valid color", () => {
    const color = new CalendarColor("#4F8DFD");

    expect(color.value).toBe("#4F8DFD");
  });

  it("should normalize color to uppercase", () => {
    const color = new CalendarColor("#4f8dfd");

    expect(color.value).toBe("#4F8DFD");
  });

  it("should use default for invalid color", () => {
    const color = new CalendarColor("invalid");

    expect(color.value).toBe("#4F8DFD");
  });

  it("should return correct color for system", () => {
    const health = CalendarColor.fromSystem("Health");
    const work = CalendarColor.fromSystem("Work");
    const relationships = CalendarColor.fromSystem("Relationships");

    expect(health.value).toBe("#EC4899");
    expect(work.value).toBe("#4F8DFD");
    expect(relationships.value).toBe("#F59E0B");
  });
});