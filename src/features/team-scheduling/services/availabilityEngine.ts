/**
 * Availability Engine - Core Algorithm for Team Scheduling
 *
 * Computes optimal meeting slots by analyzing:
 * - Existing events for all attendees
 * - Working hours preferences
 * - Focus time blocks
 * - Timezone considerations
 */

import type { TimeSlot, ConflictInfo, UserPreferences, SearchOptions } from "../types/scheduling";
import type { CalendarEvent } from "@/lib/types";

interface AvailabilityFactors {
  baseWeight: number;
  conflictPenalty: number;
  focusTimePenalty: number;
  workingHoursBonus: number;
  recencyBonus: number;
}

const SCORING: AvailabilityFactors = {
  baseWeight: 100,
  conflictPenalty: 30,
  focusTimePenalty: 20,
  workingHoursBonus: 10,
  recencyBonus: 5,
};

/**
 * Generate candidate time slots within search window
 */
function generateCandidateSlots(
  durationMinutes: number,
  searchWindowDays: number,
  incrementMinutes: number
): { startTime: number; endTime: number }[] {
  const slots: { startTime: number; endTime: number }[] = [];
  const now = Date.now();
  const windowEnd = now + (searchWindowDays * 24 * 60 * 60 * 1000);
  const durationMs = durationMinutes * 60 * 1000;

  // Start from next increment (e.g., next 30-min mark)
  let currentTime = Math.ceil(now / (incrementMinutes * 60 * 1000)) * (incrementMinutes * 60 * 1000);

  while (currentTime + durationMs < windowEnd) {
    slots.push({
      startTime: currentTime,
      endTime: currentTime + durationMs,
    });
    currentTime += incrementMinutes * 60 * 1000;
  }

  return slots;
}

/**
 * Find conflicts for a given time slot
 */
function findConflicts(
  slot: { startTime: number; endTime: number },
  events: CalendarEvent[],
  userId: string
): ConflictInfo[] {
  const conflicts: ConflictInfo[] = [];

  for (const event of events) {
    if (!event.startTime || !event.endTime) continue;

    // Check if event overlaps with slot
    const hasOverlap =
      (event.startTime < slot.endTime && event.endTime > slot.startTime);

    if (hasOverlap && event.userId === userId) {
      conflicts.push({
        userId,
        userName: event.guests?.[0] || "Unknown",
        conflictingEventTitle: event.title,
        conflictingEventStart: event.startTime,
        conflictingEventEnd: event.endTime,
      });
    }
  }

  return conflicts;
}

/**
 * Check if slot falls within user's working hours
 */
function isWithinWorkingHours(
  slot: { startTime: number; endTime: number },
  preferences: UserPreferences
): boolean {
  const slotStart = new Date(slot.startTime);
  const dayOfWeek = slotStart.getDay();
  const hour = slotStart.getHours() + slotStart.getMinutes() / 60;

  // Check if it's a working day
  if (!preferences.workingDaysOfWeek.includes(dayOfWeek)) {
    return false;
  }

  // Check if it's within working hours
  return hour >= preferences.workingHoursStart &&
         hour + ((slot.endTime - slot.startTime) / (60 * 60 * 1000)) <= preferences.workingHoursEnd;
}

/**
 * Check if slot interrupts user's focus time
 */
function interruptsFocusTime(
  slot: { startTime: number; endTime: number },
  preferences: UserPreferences
): boolean {
  if (!preferences.focusTimeEnabled) return false;

  const slotStart = new Date(slot.startTime);
  const slotMinutes = slotStart.getHours() * 60 + slotStart.getMinutes();
  const slotEndMinutes = slotMinutes + ((slot.endTime - slot.startTime) / (60 * 1000));

  return slotMinutes < preferences.focusTimeEnd && slotEndMinutes > preferences.focusTimeStart;
}

/**
 * Main availability computation function
 */
export async function computeAvailableSlots(
  events: CalendarEvent[],
  userPreferences: UserPreferences[],
  options: SearchOptions
): Promise<TimeSlot[]> {
  const candidateSlots = generateCandidateSlots(
    options.durationMinutes,
    options.searchWindowDays,
    options.incrementMinutes
  );

  const prefMap = new Map(userPreferences.map(p => [p.userId, p]));
  const now = Date.now();
  const soonThreshold = now + (24 * 60 * 60 * 1000); // 24 hours

  const scoredSlots = candidateSlots.map(slot => {
    let score = SCORING.baseWeight;
    const allConflicts: ConflictInfo[] = [];
    const availableMembers: string[] = [];
    const conflictedMembers: ConflictInfo[] = [];

    // Check each attendee for conflicts
    for (const preferences of userPreferences) {
      const conflicts = findConflicts(slot, events, preferences.userId);

      if (conflicts.length > 0) {
        allConflicts.push(...conflicts);
        conflictedMembers.push(...conflicts);
      } else {
        availableMembers.push(preferences.userId);
      }
    }

    // Apply conflict penalty
    const uniqueConflicts = allConflicts.filter(
      (c, i, arr) => arr.findIndex(x => x.userId === c.userId) === i
    );
    score -= uniqueConflicts.length * SCORING.conflictPenalty;

    // Check working hours (use first user's preferences as baseline)
    const baselinePrefs = userPreferences[0];
    const withinWorkingHours = isWithinWorkingHours(slot, baselinePrefs);

    if (options.respectWorkingHours && withinWorkingHours) {
      score += SCORING.workingHoursBonus;
    }

    // Check focus time interruption
    const interruptsFocus = interruptsFocusTime(slot, baselinePrefs);
    if (options.respectFocusTime && interruptsFocus) {
      score -= SCORING.focusTimePenalty;
    }

    // Recency bonus (prefer sooner slots)
    if (slot.startTime < soonThreshold) {
      score += SCORING.recencyBonus;
    }

    // Clamp score to 0-100
    const finalScore = Math.max(0, Math.min(100, score));

    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      availabilityScore: finalScore,
      availableMembers,
      conflictedMembers,
      isOptimal: finalScore >= 80,
      isWithinWorkingHours: withinWorkingHours,
      interruptsFocusTime: interruptsFocus,
    };
  });

  // Sort by score (descending) and return top 5
  return scoredSlots
    .sort((a, b) => b.availabilityScore - a.availabilityScore)
    .filter(slot => slot.availabilityScore > 0)
    .slice(0, 5);
}

/**
 * Format time slot for display
 */
export function formatTimeSlot(slot: TimeSlot, timezone?: string): string {
  const start = new Date(slot.startTime);
  const end = new Date(slot.endTime);

  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone || "UTC",
  };

  const startTime = start.toLocaleTimeString("en-US", options);
  const endTime = end.toLocaleTimeString("en-US", options);

  const isToday = new Date().toDateString() === start.toDateString();
  const isTomorrow = new Date(Date.now() + 86400000).toDateString() === start.toDateString();

  let dayPrefix = "";
  if (!isToday) {
    if (isTomorrow) {
      dayPrefix = "Tomorrow ";
    } else {
      dayPrefix = start.toLocaleDateString("en-US", { weekday: "short" }) + " ";
    }
  }

  return `${dayPrefix}${startTime} - ${endTime}`;
}
