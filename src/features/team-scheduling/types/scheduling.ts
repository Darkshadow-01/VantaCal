/**
 * Team Scheduling Feature - Type Definitions
 */

export interface TimeSlot {
  startTime: number;
  endTime: number;
  availabilityScore: number; // 0-100
  availableMembers: string[]; // userIds
  conflictedMembers: ConflictInfo[];
  isOptimal: boolean;
  isWithinWorkingHours: boolean;
  interruptsFocusTime: boolean;
}

export interface ConflictInfo {
  userId: string;
  userName: string;
  conflictingEventTitle: string;
  conflictingEventStart: number;
  conflictingEventEnd: number;
}

export interface UserPreferences {
  userId: string;
  userName: string;
  workingHoursStart: number; // 0-23
  workingHoursEnd: number; // 0-23
  workingDaysOfWeek: number[]; // [0,1,2,3,4,5,6] = [Sun,Mon,Tue,Wed,Thu,Fri,Sat]
  focusTimeEnabled: boolean;
  focusTimeStart: number; // minutes from midnight
  focusTimeEnd: number;
  timezone: string;
}

export interface SearchOptions {
  durationMinutes: number;
  searchWindowDays: number;
  incrementMinutes: number;
  respectWorkingHours: boolean;
  respectFocusTime: boolean;
  requireAllAttendees: boolean;
  ignorePartialConflicts: boolean;
}

export interface ScheduleTeamFormData {
  title: string;
  attendeeIds: string[];
  durationMinutes: number;
  description?: string;
  location?: string;
  videoLink?: boolean;
}

export interface MeetingRequestResult {
  success: boolean;
  meetingRequestId?: string;
  eventId?: string;
  error?: string;
}

export const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  durationMinutes: 30,
  searchWindowDays: 7,
  incrementMinutes: 30,
  respectWorkingHours: true,
  respectFocusTime: true,
  requireAllAttendees: false,
  ignorePartialConflicts: false,
};

export const DURATION_OPTIONS = [
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 45, label: "45 minutes" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];
