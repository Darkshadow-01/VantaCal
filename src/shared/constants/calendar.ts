export const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

export const DAY_NAMES = DAYS;
export const MONTH_NAMES = MONTHS;

export type DayName = typeof DAYS[number];
export type MonthName = typeof MONTHS[number];