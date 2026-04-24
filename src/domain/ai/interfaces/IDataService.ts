import type { CalendarEvent } from "@/src/domain/calendar/event";

export interface WeeklyMemories {
  category: string;
  content: string;
  outcome?: string;
  timestamp?: number;
}

export interface MissedTask {
  eventTitle: string;
  frequency: number;
  system?: string;
}

export interface HabitTrend {
  habit: string;
  streak: number;
  longestStreak: number;
}

export interface WeeklyPlanData {
  weekStartDate: string;
  weekEndDate: string;
  userId: string;
  planData: object;
  createdAt: number;
}

export interface IDataService {
  getEvents(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>;
  getMemories(userId: string, limit?: number): Promise<WeeklyMemories[]>;
  getMissedTasks(userId: string, limit?: number): Promise<MissedTask[]>;
  getHabitTrends(userId: string): Promise<HabitTrend[]>;
  saveWeeklyPlan(userId: string, plan: object): Promise<string | null>;
  getWeeklyPlan(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyPlanData | null>;
}