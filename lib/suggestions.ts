interface EventForSuggestion {
  id: string;
  date: number;
  month: number;
  year: number;
  hour?: number;
  calendarId: string;
  type?: string;
}

export interface Suggestion {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
  hour: number;
  duration: number;
  system: "Health" | "Work" | "Relationships";
  color: string;
  type: "event" | "task" | "meeting";
  reason: string;
}

const SYSTEM_COLORS = {
  Health: "#3BA55D",
  Work: "#4F8DFD",
  Relationships: "#8B5CF6"
};

interface BehaviorInsights {
  completionRate: number;
  healthNeglected: boolean;
  overloaded: boolean;
}

function getBehaviorInsights(events: EventForSuggestion[]): BehaviorInsights {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const lastWeek = events.filter((e) => {
    const eventDate = new Date(e.year, e.month, e.date);
    return eventDate >= sevenDaysAgo && eventDate <= now;
  });

  const health = lastWeek.filter((e) => e.calendarId === "tasks").length;
  const work = lastWeek.filter((e) => e.calendarId === "personal").length;

  return {
    completionRate: 0.8,
    healthNeglected: health < 2,
    overloaded: work > 5,
  };
}

export function generateSuggestions(
  events: EventForSuggestion[],
  currentDate: Date
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const occupiedSlots = getOccupiedSlots(events, currentDate);
  
  const insights = getBehaviorInsights(events);
  
  const maxSuggestions = insights.overloaded ? 3 : 5;

  // Rule 1: Morning workout if no Health events this week (or if health neglected)
  const hasHealthEvents = events.some(e => 
    e.calendarId === "tasks" && isThisWeek(e, currentDate)
  );
  if (!hasHealthEvents || insights.healthNeglected) {
    const slot = findAvailableSlot(occupiedSlots, 7, 8, currentDate);
    if (slot) {
      suggestions.push({
        id: "sug-1",
        title: "Morning Workout",
        day: slot.day,
        month: slot.month,
        year: slot.year,
        hour: 7,
        duration: 60,
        system: "Health",
        color: SYSTEM_COLORS.Health,
        type: "task",
        reason: "You haven't scheduled any Health activities in the last 7 days - adding a morning routine helps set a positive tone for your day"
      });
    }
  }

  // Rule 2: Break after long work block
  const hasLongWorkBlock = checkLongWorkBlock(events, currentDate);
  if (hasLongWorkBlock) {
    const slot = findAvailableSlot(occupiedSlots, 14, 15, currentDate);
    if (slot && suggestions.length < 4) {
      suggestions.push({
        id: "sug-2",
        title: "Break / Walk",
        day: slot.day,
        month: slot.month,
        year: slot.year,
        hour: 14,
        duration: 30,
        system: "Health",
        color: SYSTEM_COLORS.Health,
        type: "event",
        reason: "You have 3+ work items on the same day - a short break mid-day will help maintain focus and energy"
      });
    }
  }

  // Rule 3: Team sync if work events but no meetings
  const workEvents = events.filter(e => 
    e.calendarId === "personal" && isThisWeek(e, currentDate)
  );
  const hasMeetings = workEvents.some(e => e.type === "meeting");
  if (workEvents.length > 0 && !hasMeetings) {
    const slot = findAvailableSlot(occupiedSlots, 10, 11, currentDate);
    if (slot && suggestions.length < 4) {
      suggestions.push({
        id: "sug-3",
        title: "Team Sync",
        day: slot.day,
        month: slot.month,
        year: slot.year,
        hour: 10,
        duration: 30,
        system: "Work",
        color: SYSTEM_COLORS.Work,
        type: "meeting",
        reason: "You have work events scheduled but no meetings this week - a quick sync can help align priorities"
      });
    }
  }

  // Rule 4: Social lunch if no Relationships events
  const hasRelationshipEvents = events.some(e => 
    (e.type === "personal" || e.calendarId === "birthdays") && isThisWeek(e, currentDate)
  );
  if (!hasRelationshipEvents) {
    const slot = findAvailableSlot(occupiedSlots, 12, 13, currentDate);
    if (slot && suggestions.length < 5) {
      suggestions.push({
        id: "sug-4",
        title: "Lunch with Friend",
        day: slot.day,
        month: slot.month,
        year: slot.year,
        hour: 12,
        duration: 60,
        system: "Relationships",
        color: SYSTEM_COLORS.Relationships,
        type: "event",
        reason: "No social or relationship events this week - connecting with someone over lunch can boost mood and productivity"
      });
    }
  }

  // Rule 5: Daily review as fallback
  if (suggestions.length < 3) {
    const slot = findAvailableSlot(occupiedSlots, 17, 18, currentDate);
    if (slot && suggestions.length < 5) {
      suggestions.push({
        id: "sug-5",
        title: "Daily Review",
        day: slot.day,
        month: slot.month,
        year: slot.year,
        hour: 17,
        duration: 15,
        system: "Work",
        color: SYSTEM_COLORS.Work,
        type: "task",
        reason: "End your day on a high note - 15 minutes to review what you accomplished and plan for tomorrow"
      });
    }
  }

  return suggestions.slice(0, maxSuggestions);
}

// Helper functions
function getOccupiedSlots(events: EventForSuggestion[], date: Date): Set<string> {
  const occupied = new Set<string>();
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  events.forEach(e => {
    if (e.hour !== undefined) {
      const eventDate = new Date(e.year, e.month, e.date);
      if (eventDate >= weekStart && eventDate < weekEnd) {
        occupied.add(`${e.date}-${e.month}-${e.year}-${e.hour}`);
      }
    }
  });
  return occupied;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(date.getDate() - date.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function isThisWeek(event: EventForSuggestion, currentDate: Date): boolean {
  const eventDate = new Date(event.year, event.month, event.date);
  const weekStart = getWeekStart(currentDate);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);
  return eventDate >= weekStart && eventDate < weekEnd;
}

function checkLongWorkBlock(events: EventForSuggestion[], currentDate: Date): boolean {
  const workDays = new Map<number, number>();
  events
    .filter(e => e.calendarId === "personal" && isThisWeek(e, currentDate))
    .forEach(e => {
      const count = workDays.get(e.date) || 0;
      workDays.set(e.date, count + 1);
    });
  return Array.from(workDays.values()).some(count => count >= 3);
}

function findAvailableSlot(
  occupied: Set<string>,
  preferredStart: number,
  preferredEnd: number,
  currentDate: Date
): { day: number; month: number; year: number } | null {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const weekStart = getWeekStart(currentDate);

  for (let d = 0; d < 7; d++) {
    const day = weekStart.getDate() + d;
    const monthToCheck = weekStart.getMonth();
    const yearToCheck = weekStart.getFullYear();
    
    // Check if day is valid for this month
    const daysInMonth = new Date(yearToCheck, monthToCheck + 1, 0).getDate();
    if (day < 1 || day > daysInMonth) continue;

    for (let hour = preferredStart; hour < preferredEnd; hour++) {
      const key = `${day}-${monthToCheck}-${yearToCheck}-${hour}`;
      if (!occupied.has(key)) {
        return { day, month: monthToCheck, year: yearToCheck };
      }
    }
  }
  return null;
}
