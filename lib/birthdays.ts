import { format, eachDayOfInterval, startOfYear, endOfYear, isSameDay, addYears } from "date-fns";

export interface Birthday {
  id: string;
  name: string;
  date: Date;
  year?: number;
  relation: "family" | "friend" | "colleague" | "other";
  notifyDays: number[];
  color?: string;
  upcomingDate?: Date;
  ageAtBirthday?: number;
}

export interface BirthdaysByDate {
  [key: string]: Birthday[];
}

export function formatBirthdayDate(date: Date, year?: number): string {
  if (year) {
    return format(date, `MMMM d, '${year.toString().slice(-2)}`);
  }
  return format(date, "MMMM d");
}

export function getUpcomingBirthdays(
  birthdays: Birthday[],
  daysAhead: number = 30
): Birthday[] {
  const today = new Date();
  const endDate = addDays(today, daysAhead);
  const thisYear = today.getFullYear();

  const upcoming: Birthday[] = [];

  birthdays.forEach((birthday) => {
    const thisYearBirthday = new Date(thisYear, birthday.date.getMonth(), birthday.date.getDate());
    const nextYearBirthday = new Date(thisYear + 1, birthday.date.getMonth(), birthday.date.getDate());

    let targetDate: Date;
    if (thisYearBirthday >= today && thisYearBirthday <= endDate) {
      targetDate = thisYearBirthday;
    } else if (nextYearBirthday <= endDate) {
      targetDate = nextYearBirthday;
    } else {
      return;
    }

    upcoming.push({
      ...birthday,
      upcomingDate: targetDate,
      ageAtBirthday: birthday.year ? targetDate.getFullYear() - birthday.year : undefined,
    });
  });

  return upcoming.sort((a, b) => {
    const dateA = a.upcomingDate || new Date();
    const dateB = b.upcomingDate || new Date();
    return dateA.getTime() - dateB.getTime();
  });
}

export function getBirthdaysInRange(
  startDate: Date,
  endDate: Date,
  birthdays: Birthday[]
): Birthday[] {
  const result: Birthday[] = [];
  const thisYear = startDate.getFullYear();

  birthdays.forEach((birthday) => {
    const birthdayThisYear = new Date(thisYear, birthday.date.getMonth(), birthday.date.getDate());
    const birthdayNextYear = new Date(thisYear + 1, birthday.date.getMonth(), birthday.date.getDate());

    if (birthdayThisYear >= startDate && birthdayThisYear <= endDate) {
      result.push({ ...birthday, upcomingDate: birthdayThisYear });
    } else if (birthdayNextYear >= startDate && birthdayNextYear <= endDate) {
      result.push({ ...birthday, upcomingDate: birthdayNextYear });
    }
  });

  return result;
}

export function isBirthdayToday(birthdays: BirthdaysByDate): boolean {
  const today = new Date();
  const key = format(today, "yyyy-MM-dd");
  return !!birthdays[key] && birthdays[key].length > 0;
}

export function getBirthdayOnDate(date: Date, birthdays: BirthdaysByDate): Birthday | null {
  const key = format(date, "yyyy-MM-dd");
  const dayBirthdays = birthdays[key];
  if (dayBirthdays && dayBirthdays.length > 0) {
    return dayBirthdays[0];
  }
  return null;
}

export function getNextBirthday(birthdays: Birthday[]): Birthday | null {
  const today = new Date();
  const thisYear = today.getFullYear();
  
  let nearest: Birthday | null = null;
  let nearestDate: Date | null = null;

  birthdays.forEach((birthday) => {
    const thisYearDate = new Date(thisYear, birthday.date.getMonth(), birthday.date.getDate());
    const nextYearDate = new Date(thisYear + 1, birthday.date.getMonth(), birthday.date.getDate());
    
    let targetDate: Date;
    if (thisYearDate >= today) {
      targetDate = thisYearDate;
    } else if (nextYearDate >= today) {
      targetDate = nextYearDate;
    } else {
      return;
    }

    if (!nearestDate || targetDate < nearestDate) {
      nearest = birthday;
      nearestDate = targetDate;
    }
  });

  return nearest;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const RELATION_TYPES = [
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦" },
  { value: "friend", label: "Friend", icon: "🤝" },
  { value: "colleague", label: "Colleague", icon: "💼" },
  { value: "other", label: "Other", icon: "👤" },
];