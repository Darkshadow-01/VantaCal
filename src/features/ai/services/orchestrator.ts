import { ConvexHttpClient } from "convex/browser";
import { runPlannerAgent, runSchedulerAgent, runReflectionAgent, runCoachAgent } from "./localAI";
import type { WeeklyPlan, WeeklyBlueprint, ConflictResolution, WeeklyReflection, CoachNudges } from "../model/types";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function convexQuery(functionName: string, args: Record<string, unknown>) {
  return await (convex.query as (name: string, args: Record<string, unknown>) => Promise<unknown>)(functionName, args);
}

async function convexMutate(functionName: string, args: Record<string, unknown>) {
  return await (convex.mutation as (name: string, args: Record<string, unknown>) => Promise<unknown>)(functionName, args);
}

async function getWeekDates(weekOffset: number = 0): Promise<{ start: Date; end: Date }> {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek + weekOffset * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

async function fetchWeeklyEvents(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<Array<{
  _id: string;
  title: string;
  system: string;
  startTime: number;
  endTime: number;
  completed?: boolean;
}>> {
  try {
    const events = await convexQuery("events/index.getEvents", { userId }) as any[];
    return (events || []).filter((e: { startTime: number }) => {
      const eventTime = e.startTime / 1000;
      return eventTime >= weekStart.getTime() / 1000 && eventTime <= weekEnd.getTime() / 1000;
    });
  } catch {
    return [];
  }
}

async function fetchWeeklyMemories(
  userId: string,
  weekStart: Date,
  weekEnd: Date
): Promise<Array<{
  category: string;
  content: string;
  outcome?: string;
}>> {
  try {
    const memories = await convexQuery("memory/index.getMemories", {
      userId,
      limit: 50,
    }) as any[];
    return (memories || []).filter((m: { timestamp?: number }) => {
      if (!m.timestamp) return false;
      const memTime = m.timestamp * 1000;
      return memTime >= weekStart.getTime() && memTime <= weekEnd.getTime();
    });
  } catch {
    return [];
  }
}

async function fetchMissedTasks(
  userId: string
): Promise<Array<{ eventTitle: string; frequency: number; system?: string }>> {
  try {
    const missed = await convexQuery("memory/index.getMissedTasks", {
      userId,
      limit: 20,
    }) as any[];
    return missed || [];
  } catch {
    return [];
  }
}

async function fetchHabitTrends(
  userId: string
): Promise<Array<{ habit: string; streak: number; longestStreak: number }>> {
  try {
    const trends = await convexQuery("memory/index.getHabitTrends", { userId }) as any[];
    return trends || [];
  } catch {
    return [];
  }
}

async function storeWeeklyPlan(
  userId: string,
  plan: WeeklyPlan
): Promise<string | null> {
  try {
    const id = await convexMutate("weeklyPlans/index.create", {
      userId,
      weekStart: new Date(plan.weekStartDate).getTime(),
      weekEnd: new Date(plan.weekEndDate).getTime(),
      planData: plan,
      createdAt: Date.now(),
    });
    return id as string | null;
  } catch {
    return null;
  }
}

function generateExecutionPlan(
  weekStart: Date,
  weekEnd: Date,
  events: Array<{
    title: string;
    system: string;
    startTime: number;
    endTime: number;
    _id: string;
  }>,
  blueprint: WeeklyBlueprint,
  conflictResolution: ConflictResolution,
  coachNudges: CoachNudges
): WeeklyPlan["executionPlan"] {
  const days: WeeklyPlan["executionPlan"] = [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  type ExecutionEvent = {
    title: string;
    system: "Health" | "Work" | "Relationships";
    startTime: string;
    endTime: string;
    isBuffer: boolean;
    bufferPurpose?: string;
    nudge?: string;
  };

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);

    const dayEvents: ExecutionEvent[] = events
      .filter((e) => {
        const eventDate = new Date(e.startTime);
        return eventDate.toDateString() === currentDate.toDateString();
      })
      .map((e) => ({
        title: e.title,
        system: e.system as "Health" | "Work" | "Relationships",
        startTime: new Date(e.startTime).toISOString(),
        endTime: new Date(e.endTime).toISOString(),
        isBuffer: false,
      }));

    const dayBuffers = conflictResolution.buffers.filter((b) => {
      const bufferDate = new Date(b.before);
      return bufferDate.toDateString() === currentDate.toDateString();
    });

    dayBuffers.forEach((b) => {
      dayEvents.push({
        title: `${b.duration}min Buffer`,
        system: "Work" as const,
        startTime: new Date(b.before).toISOString(),
        endTime: new Date(new Date(b.before).getTime() + b.duration * 60000).toISOString(),
        isBuffer: true,
        bufferPurpose: b.purpose,
      });
    });

    const dayNudges = coachNudges.reminders.filter((n) => {
      const nudgeDate = new Date(n.scheduledTime);
      return nudgeDate.toDateString() === currentDate.toDateString();
    });

    dayNudges.forEach((n) => {
      const existingEvent = dayEvents.find(
        (e) => e.title === n.eventTitle && new Date(e.startTime).toDateString() === currentDate.toDateString()
      );
      if (existingEvent) {
        existingEvent.nudge = n.nudgeMessage;
      }
    });

    dayEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    days.push({
      day: dayNames[i],
      date: currentDate.toISOString(),
      events: dayEvents,
    });
  }

  return days;
}

export async function orchestrateWeeklyPlan(
  userId: string,
  userGoals?: {
    health?: string[];
    work?: string[];
    relationships?: string[];
  },
  weekOffset: number = 0
): Promise<WeeklyPlan> {
  const { start: weekStart, end: weekEnd } = await getWeekDates(weekOffset);

  const events = await fetchWeeklyEvents(userId, weekStart, weekEnd);
  const memories = await fetchWeeklyMemories(userId, weekStart, weekEnd);
  const missedTasks = await fetchMissedTasks(userId);
  const habitTrends = await fetchHabitTrends(userId);

  const systemAllocation = {
    health: { hoursTarget: 10, percentage: 30 },
    work: { hoursTarget: 17, percentage: 50 },
    relationships: { hoursTarget: 7, percentage: 20 },
  };

  const goals = {
    health: userGoals?.health || ["Exercise 3x", "Sleep 7+ hours"],
    work: userGoals?.work || ["Complete project milestones", "Daily standups"],
    relationships: userGoals?.relationships || ["Family dinner 2x", "Call friends weekly"],
  };

  let blueprint: WeeklyBlueprint | null = null;
  let conflictResolution: ConflictResolution | null = null;
  let reflection: WeeklyReflection | null = null;
  let coachNudges: CoachNudges | null = null;

  try {
    const plannerResult = await runPlannerAgent(
      `Create a weekly blueprint for week of ${weekStart.toDateString()}. ` +
      `User goals: Health - ${(goals?.health || []).join(", ")}. Work - ${(goals?.work || []).join(", ")}. ` +
      `Relationships - ${(goals?.relationships || []).join(", ")}. ` +
      `Current events: ${events.length}. Target allocation: Health ${systemAllocation.health.percentage}%, ` +
      `Work ${systemAllocation.work.percentage}%, Relationships ${systemAllocation.relationships.percentage}%.`
    );

    blueprint = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      userId,
      goals,
      plannedEvents: (plannerResult.plannedEvents || []) as WeeklyBlueprint["plannedEvents"],
      systemAllocation,
      successMetrics: (plannerResult.successMetrics || []) as string[],
      confidence: (plannerResult.confidence as number) || 0.5,
    };
  } catch (error) {
    console.error("Planner agent failed:", error);
    blueprint = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      userId,
      goals,
      plannedEvents: [],
      systemAllocation,
      successMetrics: [],
      confidence: 0,
    };
  }

  try {
    const schedulerResult = await runSchedulerAgent({
      action: "optimize_schedule",
      events: events.map((e) => ({
        id: e._id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        system: e.system,
      })),
      system: undefined,
      userId,
    });

    conflictResolution = {
      conflicts: (schedulerResult.conflicts || []) as ConflictResolution["conflicts"],
      buffers: (schedulerResult.buffers || []) as ConflictResolution["buffers"],
      rescheduledEvents: (schedulerResult.rescheduled || []) as ConflictResolution["rescheduledEvents"],
    };
  } catch (error) {
    console.error("Scheduler agent failed:", error);
    conflictResolution = {
      conflicts: [],
      buffers: [],
      rescheduledEvents: [],
    };
  }

  const completedEvents = events.filter((e) => e.completed).length;
  const totalEvents = events.length;

  const distribution: Record<string, number> = {
    Health: 0,
    Work: 0,
    Relationships: 0,
  };
  events.forEach((e) => {
    if (distribution[e.system] !== undefined) {
      distribution[e.system]++;
    }
  });

  try {
    const reflectionResult = await runReflectionAgent({
      totalEvents,
      completed: completedEvents,
      missed: missedTasks.length,
      distribution,
    });

    reflection = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      completionRate: (reflectionResult.completionRate as number) || Math.round((completedEvents / totalEvents) * 100) || 0,
      systemBalance: {
        health: {
          planned: distribution.Health,
          completed: events.filter((e) => e.system === "Health" && e.completed).length,
          percentage: totalEvents > 0 ? Math.round((distribution.Health / totalEvents) * 100) : 0,
        },
        work: {
          planned: distribution.Work,
          completed: events.filter((e) => e.system === "Work" && e.completed).length,
          percentage: totalEvents > 0 ? Math.round((distribution.Work / totalEvents) * 100) : 0,
        },
        relationships: {
          planned: distribution.Relationships,
          completed: events.filter((e) => e.system === "Relationships" && e.completed).length,
          percentage: totalEvents > 0 ? Math.round((distribution.Relationships / totalEvents) * 100) : 0,
        },
      },
      insights: (reflectionResult.insights || []) as string[],
      recommendations: (reflectionResult.recommendations || []) as string[],
      grade: (reflectionResult.grade as WeeklyReflection["grade"]) || "C",
      missedPatterns: missedTasks.map((m) => ({
        eventTitle: m.eventTitle,
        frequency: m.frequency,
        suggestedAction: `Consider rescheduling or adjusting "${m.eventTitle}"`,
      })),
      wins: memories
        .filter((m) => m.outcome === "completed")
        .map((m) => m.content)
        .slice(0, 5),
    };
  } catch (error) {
    console.error("Reflection agent failed:", error);
    reflection = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      completionRate: totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0,
      systemBalance: {
        health: { planned: 0, completed: 0, percentage: 0 },
        work: { planned: 0, completed: 0, percentage: 0 },
        relationships: { planned: 0, completed: 0, percentage: 0 },
      },
      insights: [],
      recommendations: [],
      grade: "C",
      missedPatterns: [],
      wins: [],
    };
  }

  const atRiskStreaks = habitTrends.filter((h) => h.streak > 0 && h.streak < 3);
  const streakStatus = (streak: number, longest: number): "active" | "at_risk" | "broken" => {
    if (streak === 0) return "broken";
    if (streak < longest * 0.3) return "at_risk";
    return "active";
  };

  try {
    const coachResult = await runCoachAgent({
      action: habitTrends.length > 0 ? "motivation_assessment" : "habit_plan",
      userId,
      system: undefined,
      streakData: habitTrends.length > 0
        ? {
            current: habitTrends[0]?.streak || 0,
            longest: habitTrends[0]?.longestStreak || 0,
            atRisk: atRiskStreaks.length > 0,
          }
        : undefined,
      motivationLevel: reflection.completionRate > 70 ? 8 : reflection.completionRate > 50 ? 6 : 4,
      recentWins: reflection.wins,
      barriers: reflection.missedPatterns.map((m) => m.eventTitle),
    });

    coachNudges = {
      reminders: (blueprint.plannedEvents || []).slice(0, 5).map((e) => ({
        eventTitle: e.title,
        scheduledTime: e.suggestedTime,
        nudgeMessage: `Time for ${e.title} - ${e.rationale}`,
        type: "reminder" as const,
      })),
      habitSuggestions: ((coachResult.recommendations || []) as Array<{ action?: string; cue?: string; rationale?: string }>).slice(0, 3).map((r) => ({
        habit: r.action || "",
        cue: r.cue || "",
        routine: r.action || "",
        reward: r.rationale || "",
        integration: "Add to calendar",
      })),
      motivationBoost: (coachResult.motivationBoost as string) || (coachResult.encouragement as string) || "Keep going!",
      streakUpdates: habitTrends.slice(0, 5).map((h) => ({
        habit: h.habit,
        currentStreak: h.streak,
        longestStreak: h.longestStreak,
        status: streakStatus(h.streak, h.longestStreak),
      })),
    };
  } catch (error) {
    console.error("Coach agent failed:", error);
    coachNudges = {
      reminders: [],
      habitSuggestions: [],
      motivationBoost: "Keep going!",
      streakUpdates: [],
    };
  }

  const executionPlan = generateExecutionPlan(
    weekStart,
    weekEnd,
    events,
    blueprint,
    conflictResolution,
    coachNudges
  );

  const weeklyPlan: WeeklyPlan = {
    generatedAt: new Date().toISOString(),
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    userId,
    blueprint,
    conflictResolution,
    reflection,
    coachNudges,
    executionPlan,
    metadata: {
      plannerConfidence: blueprint.confidence,
      conflictCount: conflictResolution.conflicts.length,
      suggestedChanges: conflictResolution.rescheduledEvents.length + conflictResolution.buffers.length,
      localAIAvailable: true,
    },
  };

  await storeWeeklyPlan(userId, weeklyPlan);

  return weeklyPlan;
}

export async function getWeeklyPlan(
  userId: string,
  weekOffset: number = 0
): Promise<WeeklyPlan | null> {
  try {
    const { start: weekStart, end: weekEnd } = await getWeekDates(weekOffset);

    const plans = await convexQuery("weeklyPlans/index.getByWeek", {
      userId,
      weekStart: weekStart.getTime(),
      weekEnd: weekEnd.getTime(),
    }) as any[];

    if (plans && plans.length > 0) {
      return plans[0].planData as WeeklyPlan;
    }

    return await orchestrateWeeklyPlan(userId, undefined, weekOffset);
  } catch (error) {
    console.error("Failed to get weekly plan:", error);
    return null;
  }
}

export function extractActionableItems(plan: WeeklyPlan): {
  today: string[];
  thisWeek: string[];
  habits: string[];
} {
  const today = new Date().toDateString();
  const todayEvents = plan.executionPlan.find((d) => new Date(d.date).toDateString() === today);

  return {
    today: (todayEvents?.events || [])
      .filter((e) => !e.isBuffer)
      .map((e) => `${e.title} at ${new Date(e.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`),
    thisWeek: plan.blueprint.plannedEvents
      .filter((e) => e.priority === "high")
      .map((e) => e.title),
    habits: plan.coachNudges.habitSuggestions.map((h) => h.habit),
  };
}