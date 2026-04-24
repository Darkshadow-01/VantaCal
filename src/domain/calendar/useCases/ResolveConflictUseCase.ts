import type { IEventRepository } from "../interfaces/IEventRepository";
import type { CalendarEvent } from "../event";
import { detectConflicts, type ConflictInfo } from "@/src/features/calendar/service/conflict-detection";

export interface ResolveConflictInput {
  eventId: string;
  newStartTime: number;
  newEndTime: number;
}

export interface ResolveConflictResult {
  success: boolean;
  conflicts: ConflictInfo[];
  resolution?: {
    originalEvent: CalendarEvent;
    newTimes: { start: number; end: number };
  };
  error?: string;
}

export class ResolveConflictUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(
    eventId: string,
    proposedTimes: ResolveConflictInput
  ): Promise<ResolveConflictResult> {
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      return { success: false, error: "Event not found", conflicts: [] };
    }

    const existingEvents = await this.eventRepository.findByDateRange(
      event.userId ?? "",
      new Date(proposedTimes.newStartTime - 86400000 * 7),
      new Date(proposedTimes.newStartTime + 86400000 * 7)
    );

    const tempEvent: CalendarEvent = {
      ...event,
      id: eventId,
      startTime: proposedTimes.newStartTime,
      endTime: proposedTimes.newEndTime,
    };

    const conflicts = detectConflicts(tempEvent, existingEvents.filter(e => e.id !== eventId));

    const hasBlockingConflict = conflicts.some(c => c.severity === "blocking");

    if (hasBlockingConflict) {
      const closestAvailableSlot = this.findClosestAvailableSlot(
        proposedTimes.newStartTime,
        proposedTimes.newEndTime,
        existingEvents.filter(e => e.id !== eventId)
      );

      return {
        success: false,
        conflicts,
        resolution: closestAvailableSlot
          ? { originalEvent: event, newTimes: closestAvailableSlot }
          : undefined,
      };
    }

    return { success: true, conflicts };
  }

  private findClosestAvailableSlot(
    start: number,
    end: number,
    existingEvents: CalendarEvent[]
  ): { start: number; end: number } | null {
    const duration = end - start;
    const slotTime = 30 * 60000;
    
    for (let offset = 0; offset <= 24 * 60 * 60 * 1000; offset += slotTime) {
      for (const direction of [1, -1]) {
        const candidateStart = start + (offset * direction);
        const candidateEnd = candidateStart + duration;

        const hasConflict = existingEvents.some(e => {
          if (!e.startTime || !e.endTime) return false;
          return candidateStart < e.endTime && candidateEnd > e.startTime;
        });

        if (!hasConflict) {
          return { start: candidateStart, end: candidateEnd };
        }
      }
    }

    return null;
  }
}