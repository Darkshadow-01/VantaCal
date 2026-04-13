import { addDays, addWeeks, addMonths, addYears, startOfDay, getDay, getDate, getMonth } from "date-fns";

export type RecurrenceType = "daily" | "weekly" | "biweekly" | "monthly" | "yearly" | "weekdays" | "custom" | "none";

export interface RecurrenceConfig {
  type: RecurrenceType;
  interval?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  monthOfYear?: number;
  endDate?: string | number;
  occurrences?: number;
  bySetPosition?: number;
}

export interface EventWithRecurrence {
  id?: string;
  title?: string;
  startTime?: number;
  endTime?: number;
  calendarId?: string;
  recurrence?: string | RecurrenceConfig;
  recurrenceConfig?: RecurrenceConfig;
  color?: string;
  system?: "Health" | "Work" | "Relationships";
}

const DAY_MAP: Record<string, number> = {
  SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6,
};

const DAY_NAMES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function parseRRule(rruleString: string): RecurrenceConfig | null {
  try {
    const parts = rruleString.toUpperCase().split(";");
    const config: RecurrenceConfig = { type: "none" };
    
    for (const part of parts) {
      const [key, value] = part.split("=");
      switch (key) {
        case "FREQ":
          if (value === "DAILY") config.type = "daily";
          else if (value === "WEEKLY") config.type = "weekly";
          else if (value === "MONTHLY") config.type = "monthly";
          else if (value === "YEARLY") config.type = "yearly";
          break;
        case "INTERVAL":
          config.interval = parseInt(value, 10);
          break;
        case "BYDAY":
          config.daysOfWeek = value.split(",").map(d => DAY_MAP[d] ?? 0);
          break;
        case "BYMONTHDAY":
          config.dayOfMonth = parseInt(value, 10);
          break;
        case "BYMONTH":
          config.monthOfYear = parseInt(value, 10);
          break;
        case "COUNT":
          config.occurrences = parseInt(value, 10);
          break;
        case "UNTIL":
          config.endDate = value;
          break;
        case "BYSETPOS":
          config.bySetPosition = parseInt(value, 10);
          break;
      }
    }
    
    return config.type !== "none" ? config : null;
  } catch {
    return null;
  }
}

export function toRRule(config: RecurrenceConfig): string {
  const parts = [`FREQ=${config.type.toUpperCase()}`];
  
  if (config.interval && config.interval > 1) {
    parts.push(`INTERVAL=${config.interval}`);
  }
  
  if (config.daysOfWeek?.length) {
    const days = config.daysOfWeek.map(d => DAY_NAMES[d]).join(",");
    parts.push(`BYDAY=${days}`);
  }
  
  if (config.dayOfMonth) {
    parts.push(`BYMONTHDAY=${config.dayOfMonth}`);
  }
  
  if (config.monthOfYear) {
    parts.push(`BYMONTH=${config.monthOfYear}`);
  }
  
  if (config.occurrences) {
    parts.push(`COUNT=${config.occurrences}`);
  }
  
  if (config.endDate) {
    const endStr = typeof config.endDate === 'string' 
      ? config.endDate 
      : new Date(config.endDate).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    parts.push(`UNTIL=${endStr}`);
  }
  
  return parts.join(";");
}

function getNextMonthlyDate(current: Date, interval: number = 1, dayOfMonth?: number, weekOfMonth?: number, bySetPosition?: number): Date {
  if (weekOfMonth && bySetPosition) {
    const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
    const dayOfWeek = dayOfMonth || getDay(firstDay);
    let targetDate = new Date(firstDay);
    
    const weekCount = bySetPosition > 0 ? byMonth(targetDate, dayOfWeek, bySetPosition) : byLastWeekday(targetDate, dayOfWeek, Math.abs(bySetPosition));
    
    if (targetDate <= current) {
      targetDate = new Date(current.getFullYear(), current.getMonth() + interval, 1);
      const first = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      targetDate = bySetPosition > 0 ? byMonth(first, dayOfWeek, bySetPosition) : byLastWeekday(first, dayOfWeek, Math.abs(bySetPosition));
    }
    
    return targetDate;
  }
  
  const originalDay = dayOfMonth || current.getDate();
  const next = new Date(current);
  next.setMonth(next.getMonth() + interval);
  
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(originalDay, lastDay));
  
  return next;
}

function byMonth(date: Date, targetDay: number, position: number): Date {
  let count = 0;
  const result = new Date(date);
  
  for (let d = 1; d <= 31; d++) {
    result.setDate(d);
    if (result.getMonth() !== date.getMonth()) break;
    if (result.getDay() === targetDay) {
      count++;
      if (count === position) return result;
    }
  }
  return result;
}

function byLastWeekday(date: Date, targetDay: number, position: number): Date {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  let count = 0;
  const result = new Date(lastDay);
  
  while (result.getDate() >= 1) {
    if (result.getDay() === targetDay) {
      count++;
      if (count === position) return result;
    }
    result.setDate(result.getDate() - 1);
  }
  return result;
}

function getNextWeekdayDate(current: Date): Date {
  const day = current.getDay();
  if (day === 0) return addDays(current, 1);
  if (day === 6) return addDays(current, 2);
  return addDays(current, 1);
}

export function expandRecurringEvents<T extends EventWithRecurrence>(
  events: T[],
  currentDate: Date,
  view: "daily" | "weekly" | "monthly"
): T[] {
  const expandedEvents: T[] = [];
  const viewStart = startOfDay(currentDate);
  const viewEnd = view === "daily" 
    ? addDays(viewStart, 1) 
    : view === "weekly" 
      ? addWeeks(viewStart, 1)
      : addMonths(viewStart, 1);

  for (const event of events) {
    if (!event.startTime) continue;
    
    let recurrenceConfig: RecurrenceConfig | null = null;
    
    if (typeof event.recurrence === "string") {
      if (event.recurrence === "none" || !event.recurrence) continue;
      recurrenceConfig = { type: event.recurrence as RecurrenceType, interval: 1 };
    } else if (event.recurrence && typeof event.recurrence === "object") {
      recurrenceConfig = event.recurrence as RecurrenceConfig;
    } else if (event.recurrenceConfig) {
      recurrenceConfig = event.recurrenceConfig;
    }
    
    if (!recurrenceConfig || recurrenceConfig.type === "none") {
      const eventDate = new Date(event.startTime);
      if (eventDate >= viewStart && eventDate < viewEnd) {
        expandedEvents.push(event);
      }
      continue;
    }
    
    const startDate = new Date(event.startTime);
    const duration = (event.endTime || event.startTime) - event.startTime;
    
    if (startDate > viewEnd) continue;
    
    const maxOccurrences = recurrenceConfig.occurrences || 365;
    const endDate = recurrenceConfig.endDate;
    let currentOccurrence = new Date(startDate);
    let count = 0;
    
    while (currentOccurrence < viewEnd && count < maxOccurrences) {
      if (endDate) {
        const endTime = typeof endDate === 'string' ? new Date(endDate).getTime() : endDate;
        if (currentOccurrence.getTime() > endTime) break;
      }
      
      if (currentOccurrence >= viewStart) {
        expandedEvents.push({
          ...event,
          startTime: currentOccurrence.getTime(),
          endTime: currentOccurrence.getTime() + duration,
        } as T);
      }
      
      const interval = recurrenceConfig.interval || 1;
      
      switch (recurrenceConfig.type) {
        case "daily":
          currentOccurrence = addDays(currentOccurrence, interval);
          break;
        case "weekdays":
          currentOccurrence = getNextWeekdayDate(currentOccurrence);
          break;
        case "weekly":
          if (recurrenceConfig.daysOfWeek && recurrenceConfig.daysOfWeek.length > 0) {
            currentOccurrence = getNextWeeklyDate(currentOccurrence, interval, recurrenceConfig.daysOfWeek);
          } else {
            currentOccurrence = addWeeks(currentOccurrence, interval);
          }
          break;
        case "biweekly":
          currentOccurrence = addWeeks(currentOccurrence, interval * 2);
          break;
        case "monthly":
          currentOccurrence = getNextMonthlyDate(
            currentOccurrence, 
            interval, 
            recurrenceConfig.dayOfMonth,
            recurrenceConfig.weekOfMonth,
            recurrenceConfig.bySetPosition
          );
          break;
        case "yearly":
          currentOccurrence = addYears(currentOccurrence, interval);
          break;
        case "custom":
          currentOccurrence = addDays(currentOccurrence, interval);
          break;
        default:
          currentOccurrence = addDays(currentOccurrence, 1);
      }
      count++;
    }
  }

  return expandedEvents;
}

function getNextWeeklyDate(current: Date, interval: number = 1, daysOfWeek?: number[]): Date {
  if (daysOfWeek && daysOfWeek.length > 0) {
    const next = new Date(current);
    next.setDate(next.getDate() + 1);
    
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = next.getDay();
      if (daysOfWeek.includes(dayOfWeek)) {
        return next;
      }
      next.setDate(next.getDate() + 1);
    }
  }
  return addWeeks(current, interval);
}

export function getEventsForDate<T extends EventWithRecurrence>(
  events: T[],
  date: Date
): T[] {
  return expandRecurringEvents(events, date, "daily");
}

export function getNextOccurrence<T extends EventWithRecurrence>(event: T): Date | null {
  if (!event.startTime) return null;
  
  const now = new Date();
  const events = expandRecurringEvents([event], now, "daily");
  return events.length > 0 ? new Date(events[0].startTime!) : null;
}

export function getRecurrenceSummary(config: RecurrenceConfig): string {
  switch (config.type) {
    case "daily":
      return config.interval === 1 ? "Every day" : `Every ${config.interval} days`;
    case "weekdays":
      return "Every weekday (Mon-Fri)";
    case "weekly":
      if (config.daysOfWeek?.length) {
        const days = config.daysOfWeek.map(d => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]);
        return `Weekly on ${days.join(", ")}`;
      }
      return config.interval === 1 ? "Every week" : `Every ${config.interval} weeks`;
    case "biweekly":
      return "Every 2 weeks";
    case "monthly":
      if (config.dayOfMonth) {
        const suffix = getOrdinalSuffix(config.dayOfMonth);
        return `Monthly on the ${config.dayOfMonth}${suffix}`;
      }
      if (config.weekOfMonth && config.bySetPosition) {
        const weekNames = ["first", "second", "third", "fourth", "last"];
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const day = config.daysOfWeek ? config.daysOfWeek[0] : 0;
        return `Monthly on the ${weekNames[config.bySetPosition - 1]} ${dayNames[day]}`;
      }
      return "Monthly";
    case "yearly":
      return config.monthOfYear 
        ? `Yearly in ${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][config.monthOfYear - 1]}`
        : "Yearly";
    default:
      return "Does not repeat";
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}