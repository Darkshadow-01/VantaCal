import { format, eachDayOfInterval, startOfYear, endOfYear, isSameDay } from "date-fns";

export interface Holiday {
  date: Date;
  name: string;
  country: string;
  global: boolean;
  type: "public" | "optional" | "observance";
}

export interface HolidaysByDate {
  [key: string]: Holiday[];
}

const HOLIDAYS_API_BASE = "https://date.nager.at/api/v3";

export async function getPublicHolidays(year: number, countryCode: string = "US"): Promise<Holiday[]> {
  try {
    const response = await fetch(`${HOLIDAYS_API_BASE}/PublicHolidays/${year}/${countryCode}`);
    if (!response.ok) {
      throw new Error("Failed to fetch holidays");
    }
    const data = await response.json();
    
    return data.map((holiday: any) => ({
      date: new Date(holiday.date),
      name: holiday.localName || holiday.name,
      country: countryCode,
      global: holiday.global,
      type: "public" as const,
    }));
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return [];
  }
}

export async function getHolidaysForDateRange(
  startDate: Date,
  endDate: Date,
  countryCode: string = "US"
): Promise<HolidaysByDate> {
  const years = new Set<number>();
  years.add(startDate.getFullYear());
  years.add(endDate.getFullYear());
  
  const allHolidays: HolidaysByDate = {};
  
  for (const year of years) {
    const holidays = await getPublicHolidays(year, countryCode);
    holidays.forEach((holiday) => {
      const key = format(holiday.date, "yyyy-MM-dd");
      if (!allHolidays[key]) {
        allHolidays[key] = [];
      }
      allHolidays[key].push(holiday);
    });
  }
  
  return allHolidays;
}

export function isHoliday(date: Date, holidays: HolidaysByDate): Holiday | null {
  const key = format(date, "yyyy-MM-dd");
  const dayHolidays = holidays[key];
  if (dayHolidays && dayHolidays.length > 0) {
    return dayHolidays[0];
  }
  return null;
}

export function getHolidaysInRange(
  startDate: Date,
  endDate: Date,
  holidays: HolidaysByDate
): Holiday[] {
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const result: Holiday[] = [];
  
  days.forEach((day) => {
    const key = format(day, "yyyy-MM-dd");
    if (holidays[key]) {
      result.push(...holidays[key]);
    }
  });
  
  return result;
}

export const COMMON_COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IN", name: "India" },
  { code: "JP", name: "Japan" },
];