import type { IEventRepository } from "../interfaces/IEventRepository";
import type { CalendarEvent, EventInput } from "../event";
import { detectConflicts, type ConflictInfo } from "@/src/features/calendar/service/conflict-detection";
import { dispatchEvent, createEventCreatedEvent, createConflictDetectedEvent } from "@/src/domain/events";

export interface CreateEventInput {
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
}

export interface CreateEventResult {
  success: boolean;
  event?: CalendarEvent;
  conflicts?: ConflictInfo[];
  error?: string;
}

export class CreateEventUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(input: CreateEventInput): Promise<CreateEventResult> {
    if (!input.title?.trim()) {
      return { success: false, error: "Event title is required" };
    }

    if (!input.startTime || input.startTime <= 0) {
      return { success: false, error: "Valid start time is required" };
    }

    if (input.endTime && input.endTime <= input.startTime) {
      return { success: false, error: "End time must be after start time" };
    }

    const existingEvents = await this.eventRepository.findByDateRange(
      input.userId,
      new Date(input.startTime - 86400000 * 7),
      new Date(input.startTime + 86400000 * 7)
    );

    const tempEvent: CalendarEvent = {
      id: "temp",
      title: input.title,
      startTime: input.startTime,
      endTime: input.endTime,
      allDay: input.allDay,
      calendarId: "personal",
      color: input.color || "#4F8DFD",
      type: input.system?.toLowerCase() || "event",
      system: input.system,
      version: 1,
      updatedAt: Date.now(),
    };

    const conflicts = detectConflicts(tempEvent, existingEvents);
    const hasBlockingConflict = conflicts.some(c => c.severity === "blocking");

    if (conflicts.length > 0) {
      const conflictingEvents = conflicts
        .map(c => {
          const existing = existingEvents.find(e => e.id === c.eventId);
          return existing ? { event: existing, overlapMinutes: c.overlapMinutes } : null;
        })
        .filter((c): c is { event: CalendarEvent; overlapMinutes: number } => c !== null);
      
      if (conflictingEvents.length > 0) {
        dispatchEvent(createConflictDetectedEvent(tempEvent, conflictingEvents)).catch(console.error);
      }
    }

    if (hasBlockingConflict) {
      return {
        success: false,
        error: "Event conflicts with existing events",
        conflicts,
      };
    }

    try {
      const savedEvent = await this.eventRepository.save({
        userId: input.userId,
        title: input.title,
        description: input.description,
        startTime: input.startTime,
        endTime: input.endTime,
        allDay: input.allDay,
        system: input.system,
        color: input.color,
        location: input.location,
      });

      dispatchEvent(createEventCreatedEvent(savedEvent, input.userId)).catch(console.error);

      return {
        success: true,
        event: savedEvent,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create event",
      };
    }
  }
}