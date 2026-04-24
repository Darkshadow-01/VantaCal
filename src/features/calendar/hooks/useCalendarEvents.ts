/**
 * @deprecated Use useEventRepository + useCases instead
 * This hook mixes UI + business logic + infrastructure
 * 
 * New approach:
 * - useEventRepository: gets IEventRepository adapter
 * - CreateEventUseCase: handles business logic
 * - useCalendarEvents: UI state only
 */

import { useCallback, useMemo, useState } from "react";
import type { CalendarEvent, Calendar, EventInput } from "@/src/domain/calendar/event";
import { DEFAULT_CALENDARS } from "@/src/domain/calendar/event";

const CALENDARS_KEY = "vancal-calendars";

function getInitialVisibility() {
  try {
    const saved = localStorage.getItem(CALENDARS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const visibility: Record<string, boolean> = {};
        parsed.forEach((cal: Calendar) => {
          visibility[cal.id] = cal.visible;
        });
        return visibility;
      } catch { }
    }
  } catch { }
  const defaultVisibility: Record<string, boolean> = {};
  DEFAULT_CALENDARS.forEach(cal => {
    defaultVisibility[cal.id] = cal.visible;
  });
  return defaultVisibility;
}

export interface UseCalendarEventsState {
  events: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
}

export function useCalendarEventsBase(events: CalendarEvent[] = []) {
  const [calendarVisibility, setCalendarVisibility] = useState<Record<string, boolean>>(() => getInitialVisibility());

  const toggleCalendar = useCallback((calendarId: string) => {
    setCalendarVisibility(prev => {
      const updated = { ...prev, [calendarId]: !prev[calendarId] };
      const calendars = DEFAULT_CALENDARS.map(cal => ({
        ...cal,
        visible: updated[cal.id] ?? cal.visible,
      }));
      localStorage.setItem(CALENDARS_KEY, JSON.stringify(calendars));
      return updated;
    });
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(e => 
      calendarVisibility[e.calendarId] !== false
    );
  }, [events, calendarVisibility]);

  return {
    calendarVisibility,
    toggleCalendar,
    filteredEvents,
  };
}

export function useCalendarEvents() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { calendarVisibility, toggleCalendar, filteredEvents } = useCalendarEventsBase(events);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with useEventRepository hook
      setEvents([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    events,
    filteredEvents,
    isLoading,
    error,
    toggleCalendar,
    calendarVisibility,
    refresh,
    isLoaded: !isLoading,
  };
}