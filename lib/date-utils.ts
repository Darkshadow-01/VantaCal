/**
 * Date utilities with null safety
 */

import { format, isValid } from "date-fns";

export function safeDate(value: number | undefined | null, fallback = new Date()): Date {
  if (!value) return fallback;
  const d = new Date(value);
  return isValid(d) ? d : fallback;
}

export function formatTime(time: number | undefined, fallback = "All day"): string {
  if (!time) return fallback;
  const d = new Date(time);
  if (!isValid(d)) return fallback;
  return format(d, "h:mm a");
}

export function formatDateTime(time: number | undefined, fallback = "N/A"): string {
  if (!time) return fallback;
  const d = new Date(time);
  if (!isValid(d)) return fallback;
  return format(d, "MMM d, yyyy h:mm a");
}

export function formatDate(time: number | undefined, fallback = "N/A"): string {
  if (!time) return fallback;
  const d = new Date(time);
  if (!isValid(d)) return fallback;
  return format(d, "MMM d");
}

export function getDurationMinutes(start: number | undefined, end: number | undefined): number {
  if (!start || !end) return 0;
  return (end - start) / (1000 * 60);
}