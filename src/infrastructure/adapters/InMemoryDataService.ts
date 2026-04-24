import type { IDataService, WeeklyMemories, MissedTask, HabitTrend, WeeklyPlanData } from "@/src/domain/ai/interfaces/IDataService";

export class InMemoryDataService implements IDataService {
  private events: Map<string, any[]> = new Map();
  private memories: WeeklyMemories[] = [];
  private missedTasks: MissedTask[] = [];
  private habitTrends: HabitTrend[] = [];
  private weeklyPlans: Map<string, WeeklyPlanData> = new Map();

  async getEvents(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const userEvents = this.events.get(userId) || [];
    return userEvents.filter(
      (e: any) => e.startTime >= startDate.getTime() && e.startTime <= endDate.getTime()
    );
  }

  async getMemories(userId: string, limit?: number): Promise<WeeklyMemories[]> {
    return limit ? this.memories.slice(0, limit) : this.memories;
  }

  async getMissedTasks(userId: string, limit?: number): Promise<MissedTask[]> {
    return limit ? this.missedTasks.slice(0, limit) : this.missedTasks;
  }

  async getHabitTrends(userId: string): Promise<HabitTrend[]> {
    return this.habitTrends;
  }

  async saveWeeklyPlan(userId: string, plan: object): Promise<string | null> {
    const id = `plan-${Date.now()}`;
    this.weeklyPlans.set(id, {
      weekStartDate: "",
      weekEndDate: "",
      userId,
      planData: plan,
      createdAt: Date.now(),
    });
    return id;
  }

  async getWeeklyPlan(userId: string, weekStart: number, weekEnd: number): Promise<WeeklyPlanData | null> {
    return null;
  }

  setEvents(userId: string, events: any[]): void {
    this.events.set(userId, events);
  }

  setMemories(memories: WeeklyMemories[]): void {
    this.memories = memories;
  }

  setMissedTasks(tasks: MissedTask[]): void {
    this.missedTasks = tasks;
  }

  setHabitTrends(trends: HabitTrend[]): void {
    this.habitTrends = trends;
  }

  clear(): void {
    this.events.clear();
    this.memories = [];
    this.missedTasks = [];
    this.habitTrends = [];
    this.weeklyPlans.clear();
  }
}