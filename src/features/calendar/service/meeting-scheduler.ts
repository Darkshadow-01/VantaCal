import type { CalendarEvent } from "../model/types";

export interface TimeSlot {
  startHour: number;
  endHour: number;
  score: number;
}

export function findAvailableSlots(
  date: number,
  month: number,
  year: number,
  events: CalendarEvent[],
  workingHoursStart: number = 9,
  workingHoursEnd: number = 17,
  duration: number = 60
): TimeSlot[] {
  const targetDate = new Date(year, month, date);
  const targetDateStr = targetDate.toDateString();
  
  const dayEvents = events.filter(e => {
    if (!e.startTime) return false;
    const eventDate = new Date(e.startTime);
    return eventDate.toDateString() === targetDateStr;
  }).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  const slots: TimeSlot[] = [];
  
  for (let hour = workingHoursStart; hour <= workingHoursEnd - (duration / 60); hour++) {
    const eventEnd = hour + (duration / 60);
    let score = 100;
    
    const slotStart = new Date(year, month, date, hour).getTime();
    const slotEnd = new Date(year, month, date, eventEnd).getTime();
    
    for (const event of dayEvents) {
      if (!event.startTime || !event.endTime) continue;
      
      const eventStart = event.startTime;
      const eventEndTime = event.endTime;
      
      if (slotStart < eventEndTime && slotEnd > eventStart) {
        score = 0;
        break;
      }
      
      const distance = Math.min(
        Math.abs(slotStart - eventEndTime),
        Math.abs(slotEnd - eventStart)
      );
      
      if (distance < 1800000) score -= 20;
    }
    
    if (score > 0) {
      slots.push({ startHour: hour, endHour: eventEnd, score });
    }
  }
  
  return slots.sort((a, b) => b.score - a.score);
}

export function suggestOptimalMeetingTime(
  events: CalendarEvent[],
  duration: number = 60,
  preferredRange: { start: number; end: number } = { start: 9, end: 17 }
): { date: Date; hour: number } | null {
  const now = new Date();
  const suggestions: { date: Date; hour: number; score: number }[] = [];
  
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const candidateDate = new Date(now);
    candidateDate.setDate(now.getDate() + dayOffset);
    
    const slots = findAvailableSlots(
      candidateDate.getDate(),
      candidateDate.getMonth(),
      candidateDate.getFullYear(),
      events,
      preferredRange.start,
      preferredRange.end,
      duration
    );
    
    if (slots.length > 0) {
      suggestions.push({
        date: candidateDate,
        hour: slots[0].startHour,
        score: slots[0].score
      });
    }
  }
  
  if (suggestions.length === 0) return null;
  
  suggestions.sort((a, b) => b.score - a.score);
  return {
    date: suggestions[0].date,
    hour: suggestions[0].hour
  };
}

export function calculateBufferTime(
  events: CalendarEvent[]
): { before: number; after: number } {
  const buffers = { before: 0, after: 0 };
  
  const sorted = [...events].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (current.endTime && next.startTime) {
      const gap = next.startTime - current.endTime;
      buffers.after += gap;
      buffers.before += gap;
    }
  }
  
  return buffers;
}