import type { CalendarEvent } from "@/src/domain/calendar/event";

export interface FocusMetrics {
  focusScore: number;
  totalMeetingMinutes: number;
  bufferMinutes: number;
  fragmentationScore: number;
  systemBreakdown: { Health: number; Work: number; Relationships: number };
  isOverloaded: boolean;
  insights: string[];
  recommendedActions: string[];
}

export interface BufferSuggestion {
  eventId: string;
  type: "before" | "after" | "transition";
  duration: number;
  reason: string;
}

export interface DailyFocusData {
  date: string;
  events: CalendarEvent[];
  meetingMinutes: number;
  bufferMinutes: number;
  focusScore: number;
  isOverloaded: boolean;
  buffers: BufferSuggestion[];
}

const OVERLOAD_THRESHOLD_MINUTES = 5 * 60;
const LONG_EVENT_THRESHOLD_MINUTES = 60;
const LONG_EVENT_BUFFER_MINUTES = 15;
const BACK_TO_BACK_BUFFER_MINUTES = 10;

export function calculateDailyFocus(events: CalendarEvent[], selectedDate: Date): DailyFocusData {
  const dateKey = selectedDate.toISOString().split("T")[0];

  const dayEvents = events.filter((event) => {
    if (!event.startTime) return false;
    const eventDate = new Date(event.startTime).toISOString().split("T")[0];
    return eventDate === dateKey && !event.deleted;
  }).sort((a, b) => (a.startTime || 0) - (b.startTime || 0));

  let meetingMinutes = 0;

  for (const event of dayEvents) {
    if (event.startTime && event.endTime) {
      meetingMinutes += Math.round((event.endTime - event.startTime) / 60000);
    }
  }

  const buffers = generateBufferSuggestions(dayEvents);
  const bufferMinutes = buffers.reduce((sum, b) => sum + b.duration, 0);
  const isOverloaded = meetingMinutes > OVERLOAD_THRESHOLD_MINUTES;
  const focusScore = calculateFocusScore(meetingMinutes, bufferMinutes, dayEvents.length);

  return {
    date: dateKey,
    events: dayEvents,
    meetingMinutes,
    bufferMinutes,
    focusScore,
    isOverloaded,
    buffers,
  };
}

export function calculateFocusMetrics(dailyData: DailyFocusData): FocusMetrics {
  const { meetingMinutes, bufferMinutes, events: dayEvents, isOverloaded } = dailyData;

  const fragmentationScore = calculateFragmentation(dayEvents);
  const insights = generateInsights(dailyData);
  const recommendedActions = generateRecommendedActions(dailyData);

  const systemBreakdown = dayEvents.reduce(
    (acc, event) => {
      const duration = event.startTime && event.endTime
        ? Math.round((event.endTime - event.startTime) / 60000)
        : 0;
      acc[event.system || "Work"] += duration;
      return acc;
    },
    { Health: 0, Work: 0, Relationships: 0 }
  );

  return {
    focusScore: dailyData.focusScore,
    totalMeetingMinutes: meetingMinutes,
    bufferMinutes,
    fragmentationScore,
    systemBreakdown,
    isOverloaded,
    insights,
    recommendedActions,
  };
}

export function generateBufferSuggestions(events: CalendarEvent[]): BufferSuggestion[] {
  const suggestions: BufferSuggestion[] = [];

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event.startTime || !event.endTime) continue;

    const duration = Math.round((event.endTime - event.startTime) / 60000);

    if (duration > LONG_EVENT_THRESHOLD_MINUTES) {
      suggestions.push({
        eventId: event.id,
        type: "after",
        duration: LONG_EVENT_BUFFER_MINUTES,
        reason: `Event exceeds ${LONG_EVENT_THRESHOLD_MINUTES}min - add buffer for recovery`,
      });
    }

    if (i < events.length - 1) {
      const nextEvent = events[i + 1];
      if (nextEvent.startTime && event.endTime) {
        const gap = Math.round((nextEvent.startTime - event.endTime) / 60000);

        if (gap < BACK_TO_BACK_BUFFER_MINUTES) {
          suggestions.push({
            eventId: event.id,
            type: "transition",
            duration: BACK_TO_BACK_BUFFER_MINUTES,
            reason: "Back-to-back events - add transition buffer",
          });
        }
      }
    }
  }

  return suggestions;
}

export function calculateFocusScore(meetingMinutes: number, bufferMinutes: number, eventCount: number): number {
  if (meetingMinutes === 0) return 100;

  let score = 100;

  if (meetingMinutes > OVERLOAD_THRESHOLD_MINUTES) {
    score -= Math.min(30, (meetingMinutes - OVERLOAD_THRESHOLD_MINUTES) / 10);
  }

  const bufferRatio = meetingMinutes > 0 ? bufferMinutes / meetingMinutes : 0;
  if (bufferRatio < 0.1 && meetingMinutes > 60) {
    score -= 15;
  } else if (bufferRatio < 0.05 && meetingMinutes > 30) {
    score -= 10;
  }

  if (eventCount > 5) {
    score -= Math.min(20, (eventCount - 5) * 3);
  }

  if (bufferRatio >= 0.15 && bufferRatio <= 0.25) {
    score += 5;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateFragmentation(events: CalendarEvent[]): number {
  if (events.length < 2) return 0;

  let totalGap = 0;
  let gapCount = 0;

  for (let i = 0; i < events.length - 1; i++) {
    const current = events[i];
    const next = events[i + 1];

    if (current.endTime && next.startTime) {
      const gap = next.startTime - current.endTime;
      if (gap > 0) {
        totalGap += gap;
        gapCount++;
      }
    }
  }

  if (gapCount === 0) return 100;

  const avgGapMinutes = (totalGap / gapCount) / 60000;

  if (avgGapMinutes >= 30) return 20;
  if (avgGapMinutes >= 15) return 50;
  if (avgGapMinutes >= 5) return 70;

  return 90;
}

export function generateInsights(data: DailyFocusData): string[] {
  const insights: string[] = [];

  if (data.isOverloaded) {
    insights.push(`Your day has ${Math.round(data.meetingMinutes / 60)} hours of meetings - consider adding buffers or rescheduling.`);
  }

  if (data.meetingMinutes > 0 && data.bufferMinutes === 0) {
    insights.push("No buffers detected - add recovery time between meetings.");
  }

  if (data.events.length > 6) {
    insights.push(`High fragmentation: ${data.events.length} events today. Consider consolidating.`);
  }

  const systemMinutes = data.events.reduce((acc, e) => {
    acc[e.system || "Work"] = (acc[e.system || "Work"] || 0) +
      (e.startTime && e.endTime ? (e.endTime - e.startTime) / 60000 : 0);
    return acc;
  }, {} as Record<string, number>);

  const dominant = Object.entries(systemMinutes).sort((a, b) => b[1] - a[1])[0];
  if (dominant && dominant[1] > 180) {
    insights.push(`${dominant[0]} takes up ${Math.round(dominant[1] / 60)}h today.`);
  }

  if (insights.length === 0) {
    insights.push("Your schedule looks balanced today!");
  }

  return insights;
}

export function generateRecommendedActions(data: DailyFocusData): string[] {
  const actions: string[] = [];

  if (data.isOverloaded) {
    actions.push("Consider rescheduling non-essential meetings");
  }

  if (data.bufferMinutes === 0 && data.meetingMinutes > 60) {
    actions.push("Add 15-min buffers after long meetings");
  }

  if (data.events.length > 5) {
    actions.push("Block focus time between meetings");
  }

  if (data.events.length > 8) {
    actions.push("Review if all meetings are necessary");
  }

  return actions;
}