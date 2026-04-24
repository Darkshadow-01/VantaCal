/**
 * Team Scheduling Feature
 *
 * One-click team meeting scheduling with intelligent availability computation.
 */

export { useTeamSchedule } from "./hooks/useTeamSchedule";
export { computeAvailableSlots, formatTimeSlot } from "./services/availabilityEngine";

export type {
  TimeSlot,
  ConflictInfo,
  UserPreferences,
  SearchOptions,
  ScheduleTeamFormData,
  MeetingRequestResult,
} from "./types/scheduling";

export {
  DURATION_OPTIONS,
  DEFAULT_SEARCH_OPTIONS,
} from "./types/scheduling";
