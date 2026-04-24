export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;

  // Times stored as UTC timestamp (milliseconds since epoch)
  startTime: number;
  endTime?: number;
  allDay: boolean;

  // Timezone metadata - critical for cross-timezone correctness
  // startTimezone: timezone where the event was originally created
  // If absent, assume user's current timezone at time of creation
  startTimezone?: string;

  calendarId: string;
  color: string;
  type: string;
  system?: "Health" | "Work" | "Relationships";

  location?: string;
  guests?: string[];
  reminder?: number;
  notification?: string;

  completed?: boolean;
  actualDuration?: number;

  recurrence?: {
    type: string;
    interval?: number;
    endDate?: number;
    occurrences?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  recurrenceConfig?: {
    type: string;
    interval?: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
    weekOfMonth?: number;
    monthOfYear?: number;
    endDate?: string | number;
    occurrences?: number;
    bySetPosition?: number;
  };

  recurringEventId?: string;
  isRecurringInstance?: boolean;

  userId?: string;

  version: number;
  updatedAt: number;
  deleted?: boolean;
}

export interface EventInput {
  userId: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  allDay: boolean;
  system: "Health" | "Work" | "Relationships";
  color?: string;
  recurrence?: string;
  location?: string;
  startTimezone?: string; // Timezone where event was created
}

export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "none" | "custom";

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  endDate?: number;
  occurrences?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  visible: boolean;
}

export type ViewType = "day" | "week" | "month" | "year";

export interface Settings {
  defaultEventDuration: string;
  defaultView: ViewType;
  startWeekOn: "sunday" | "monday";
  showWeekends: boolean;
  darkMode: boolean;
  themeColor: string;
  compactView: boolean;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  dailyAgenda: boolean;
  defaultReminder: string;
  workingHours: { start: number; end: number };
  focusTimeEnabled: boolean;
  focusTimeStart: number;
  focusTimeEnd: number;
}

export type SyncStatus = "idle" | "syncing" | "error" | "offline";

export interface CalendarPermission {
  type: "view" | "edit" | "admin";
}

export interface SharedCalendar {
  id: string;
  calendarId: string;
  ownerId: string;
  ownerName: string;
  name: string;
  color: string;
  permission: CalendarPermission;
  accepted: boolean;
  createdAt: number;
}

export interface TodayDate {
  day: number;
  month: number;
  year: number;
}

export interface DailyStats {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

export interface DayReflection {
  date: string;
  completed: number;
  missed: number;
  response: "good" | "overloaded" | "too_light" | null;
  timestamp: number;
}

export interface TrendSummary {
  last7DaysCompletion: number;
  last7DaysHealthTasks: number;
  last7DaysWorkload: number;
  last7DaysRelations: number;
}

export interface SyncOperation {
  id: string;
  type: "create" | "update" | "delete";
  eventId: string;
  event: CalendarEvent | null;
  version: number;
  timestamp: number;
  retries: number;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultEventDuration: "60",
  defaultView: "month",
  startWeekOn: "sunday",
  showWeekends: true,
  darkMode: true,
  themeColor: "#5B8DEF",
  compactView: false,
  timezone: typeof window !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : (process.env.TZ || "UTC"),
  emailNotifications: true,
  pushNotifications: true,
  dailyAgenda: false,
  defaultReminder: "15",
  workingHours: { start: 9, end: 17 },
  focusTimeEnabled: false,
  focusTimeStart: 9,
  focusTimeEnd: 17,
};

export const DEFAULT_CALENDARS: Calendar[] = [
  { id: "personal", name: "Personal", color: "#4F8DFD", visible: true },
  { id: "birthdays", name: "Birthdays", color: "#EC4899", visible: true },
  { id: "tasks", name: "Tasks", color: "#F59E0B", visible: true },
  { id: "holidays", name: "Holidays", color: "#3BA55D", visible: true },
];

export function normalizeEvent(oldEvent: Record<string, unknown>): CalendarEvent {
  const now = Date.now();
  let startTime: number;

  if (typeof oldEvent.startTime === 'number') {
    startTime = oldEvent.startTime;
  } else if (
    typeof oldEvent.date === 'number' &&
    typeof oldEvent.month === 'number' &&
    typeof oldEvent.year === 'number'
  ) {
    const hour = typeof oldEvent.hour === 'number' ? oldEvent.hour : 10;
    startTime = new Date(oldEvent.year, oldEvent.month, oldEvent.date, hour).getTime();
  } else {
    startTime = now;
  }

  let endTime: number | undefined;
  if (typeof oldEvent.endTime === 'number') {
    endTime = oldEvent.endTime;
  } else if (typeof oldEvent.endHour === 'number') {
    const start = new Date(startTime);
    endTime = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      oldEvent.endHour as number
    ).getTime();
  }

  return {
    id: String(oldEvent.id || `evt-${now}-${Math.random().toString(36).substr(2, 9)}`),
    title: String(oldEvent.title || "Untitled"),
    description: typeof oldEvent.description === 'string' ? oldEvent.description : undefined,
    startTime,
    endTime,
    allDay: Boolean(oldEvent.allDay),
    startTimezone: typeof oldEvent.startTimezone === 'string' ? oldEvent.startTimezone : undefined,
    calendarId: typeof oldEvent.calendarId === 'string' ? oldEvent.calendarId : "personal",
    color: typeof oldEvent.color === 'string' ? oldEvent.color : "#4F8DFD",
    type: typeof oldEvent.type === 'string' ? oldEvent.type : "event",
    system: oldEvent.system as "Health" | "Work" | "Relationships" | undefined,
    location: typeof oldEvent.location === 'string' ? oldEvent.location : undefined,
    guests: Array.isArray(oldEvent.guests) ? oldEvent.guests : undefined,
    reminder: typeof oldEvent.reminder === 'number' ? oldEvent.reminder : undefined,
    notification: typeof oldEvent.notification === 'string' ? oldEvent.notification : undefined,
    completed: Boolean(oldEvent.completed),
    actualDuration: typeof oldEvent.actualDuration === 'number' ? oldEvent.actualDuration : undefined,
    recurrence: oldEvent.recurrence as CalendarEvent['recurrence'],
    recurringEventId: typeof oldEvent.recurringEventId === 'string' ? oldEvent.recurringEventId : undefined,
    isRecurringInstance: Boolean(oldEvent.isRecurringInstance),
    userId: typeof oldEvent.userId === 'string' ? oldEvent.userId : undefined,
    version: 1,
    updatedAt: now,
    deleted: false,
  };
}