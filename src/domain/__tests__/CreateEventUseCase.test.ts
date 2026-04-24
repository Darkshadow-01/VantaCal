import { describe, it, expect, vi, beforeEach } from "vitest";
import { CreateEventUseCase } from "@/src/domain/calendar/useCases/CreateEventUseCase";
import type { IEventRepository } from "@/src/domain/calendar/interfaces/IEventRepository";
import type { CalendarEvent } from "@/src/domain/calendar/event";

describe("CreateEventUseCase", () => {
  let mockRepository: IEventRepository;
  let useCase: CreateEventUseCase;

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      findByDateRange: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
      findConflicts: vi.fn().mockResolvedValue([]),
    };
    useCase = new CreateEventUseCase(mockRepository);
  });

  it("should create an event successfully", async () => {
    const eventData = {
      title: "Team Meeting",
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      allDay: false,
      calendarId: "personal",
      color: "#5B8DEF",
      type: "event",
    };

    const savedEvent: CalendarEvent = {
      id: "evt_123",
      title: eventData.title,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      allDay: eventData.allDay,
      calendarId: eventData.calendarId,
      color: eventData.color!,
      type: eventData.type,
      version: 1,
      updatedAt: Date.now(),
    };

    vi.mocked(mockRepository.save).mockResolvedValue(savedEvent);

    const result = await useCase.execute(eventData);

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event?.title).toBe("Team Meeting");
    expect(mockRepository.save).toHaveBeenCalled();
  });

  it("should detect conflicts with existing events", async () => {
    const startTime = Date.now();
    const endTime = startTime + 3600000;

    const conflictingEvent: CalendarEvent = {
      id: "evt_existing",
      title: "Existing Meeting",
      startTime,
      endTime,
      allDay: false,
      calendarId: "personal",
      color: "#5B8DEF",
      type: "event",
      version: 1,
      updatedAt: Date.now(),
    };

    vi.mocked(mockRepository.findConflicts).mockResolvedValue([conflictingEvent]);

    const eventData = {
      title: "New Meeting",
      startTime,
      endTime,
      allDay: false,
      calendarId: "personal",
      color: "#5B8DEF",
      type: "event",
    };

    const result = await useCase.execute(eventData);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.conflicts?.[0].event.title).toBe("Existing Meeting");
  });

  it("should reject invalid event data", async () => {
    const eventData = {
      title: "",
      startTime: Date.now(),
      endTime: Date.now() + 3600000,
      allDay: false,
      calendarId: "personal",
      color: "#5B8DEF",
      type: "event",
    };

    const result = await useCase.execute(eventData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid event: title is required");
  });

  it("should reject end time before start time", async () => {
    const eventData = {
      title: "Invalid Event",
      startTime: Date.now() + 3600000,
      endTime: Date.now(),
      allDay: false,
      calendarId: "personal",
      color: "#5B8DEF",
      type: "event",
    };

    const result = await useCase.execute(eventData);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Invalid event: endTime must be after startTime");
  });
});

describe("EventValidation", () => {
  it("should validate color format", () => {
    const validColors = ["#FF0000", "#5B8DEF", "#ABCDEF"];
    const invalidColors = ["FF0000", "#FFF", "red", "rgb(255,0,0)"];

    validColors.forEach((color) => {
      expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBe(true);
    });

    invalidColors.forEach((color) => {
      expect(/^#[0-9A-Fa-f]{6}$/.test(color)).toBe(false);
    });
  });

  it("should validate email format for guests", () => {
    const validEmails = ["test@example.com", "user.name@domain.org"];
    const invalidEmails = ["invalid", "@domain.com", "user@"];

    validEmails.forEach((email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(true);
    });

    invalidEmails.forEach((email) => {
      expect(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)).toBe(false);
    });
  });
});