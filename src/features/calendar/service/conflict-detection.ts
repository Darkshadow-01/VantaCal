import type { CalendarEvent } from "../model/types";

export interface ConflictInfo {
  eventId: string;
  title: string;
  overlapMinutes: number;
  severity: "warning" | "blocking";
  startTime: number;
  endTime: number;
}

export function detectConflicts(
  newEvent: CalendarEvent,
  existingEvents: CalendarEvent[]
): ConflictInfo[] {
  if (!newEvent.startTime || !newEvent.endTime) {
    return [];
  }

  const conflicts: ConflictInfo[] = [];
  const newStart = newEvent.startTime;
  const newEnd = newEvent.endTime;
  const newDate = new Date(newStart).toDateString();

  for (const existing of existingEvents) {
    if (!existing.startTime || !existing.endTime) continue;
    if (existing.id === newEvent.id) continue;
    
    const existingDate = new Date(existing.startTime).toDateString();
    if (existingDate !== newDate) continue;

    const existingStart = existing.startTime;
    const existingEnd = existing.endTime;

    if (newStart < existingEnd && newEnd > existingStart) {
      const overlapStart = Math.max(newStart, existingStart);
      const overlapEnd = Math.min(newEnd, existingEnd);
      const overlapMinutes = (overlapEnd - overlapStart) / 60000;

      conflicts.push({
        eventId: existing.id,
        title: existing.title,
        overlapMinutes,
        severity: overlapMinutes >= 30 ? "blocking" : "warning",
        startTime: existingStart,
        endTime: existingEnd,
      });
    }
  }

  return conflicts;
}