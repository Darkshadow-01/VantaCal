import { ConvexHttpClient } from "convex/browser";
import type { IDataService, WeeklyMemories, MissedTask, HabitTrend, WeeklyPlanData } from "@/src/domain/ai/interfaces/IDataService";
import type { CalendarEvent } from "@/src/domain/calendar/event";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function convexQuery<T>(functionName: string, args: Record<string, unknown>): Promise<T> {
  return await (convex.query as (name: string, args: Record<string, unknown>) => Promise<T>)(functionName, args);
}

async function convexMutate(functionName: string, args: Record<string, unknown>) {
  return await (convex.mutation as (name: string, args: Record<string, unknown>) => Promise<unknown>)(functionName, args);
}

interface EncryptedEventDoc {
  _id: string;
  encryptedPayload: string;
}

export class ConvexDataService implements IDataService {
  async getEvents(userId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    try {
      const events = await convexQuery<EncryptedEventDoc[]>("events/index.getEvents", { userId });
      return (events || []).map((e) => ({
        id: e._id,
        title: "Encrypted Event",
        startTime: 0,
        endTime: 0,
        allDay: false,
        calendarId: "personal",
        color: "#4F8DFD",
        type: "event",
        version: 1,
        updatedAt: Date.now(),
      }));
    } catch {
      return [];
    }
  }

  async getMemories(userId: string, limit: number = 50): Promise<WeeklyMemories[]> {
    try {
      const memories = await convexQuery<WeeklyMemories[]>("memory/index.getMemories", { userId, limit });
      return memories || [];
    } catch {
      return [];
    }
  }

  async getMissedTasks(userId: string, limit: number = 20): Promise<MissedTask[]> {
    try {
      const missed = await convexQuery<MissedTask[]>("memory/index.getMissedTasks", { userId, limit });
      return missed || [];
    } catch {
      return [];
    }
  }

  async getHabitTrends(userId: string): Promise<HabitTrend[]> {
    try {
      const trends = await convexQuery<HabitTrend[]>("memory/index.getHabitTrends", { userId });
      return trends || [];
    } catch {
      return [];
    }
  }

  async saveWeeklyPlan(userId: string, plan: object): Promise<string | null> {
    try {
      const id = await convexMutate("weeklyPlans/index.create", {
        userId,
        planData: plan,
        createdAt: Date.now(),
      });
      return id as string | null;
    } catch {
      return null;
    }
  }

  async getWeeklyPlan(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyPlanData | null> {
    try {
      const plans = await convexQuery<WeeklyPlanData[]>("weeklyPlans/index.getByWeek", {
        userId,
        weekStart,
        weekEnd,
      });
      return (plans && plans.length > 0) ? plans[0] : null;
    } catch {
      return null;
    }
  }
}

export function createDataService(): IDataService {
  return new ConvexDataService();
}