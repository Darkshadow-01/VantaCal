"use client";

import { useMemo } from "react";
import type { CalendarEvent } from "@/src/domain/calendar/event";
import {
  calculateDailyFocus,
  calculateFocusMetrics,
  type FocusMetrics,
  type BufferSuggestion,
  type DailyFocusData,
} from "@/src/domain/calendar/useCases/CalculateFocusUseCase";

export function useFocusEngine(
  events: CalendarEvent[],
  selectedDate: Date
): {
  metrics: FocusMetrics;
  dailyData: DailyFocusData;
  buffers: BufferSuggestion[];
  suggestBuffers: () => BufferSuggestion[];
} {
  const dailyData = useMemo(
    () => calculateDailyFocus(events, selectedDate),
    [events, selectedDate]
  );

  const metrics = useMemo(
    () => calculateFocusMetrics(dailyData),
    [dailyData]
  );

  const suggestBuffers = () => dailyData.buffers;

  return { metrics, dailyData, buffers: dailyData.buffers, suggestBuffers };
}