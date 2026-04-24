import type { IDataService } from "@/src/domain/ai/interfaces/IDataService";
import type { IAIService } from "@/src/domain/ai/interfaces/IAIService";
import type { CalendarEvent } from "@/src/domain/calendar/event";

export interface WeeklyBlueprint {
  weekStartDate: string;
  weekEndDate: string;
  userId: string;
  goals: {
    health: string[];
    work: string[];
    relationships: string[];
  };
  plannedEvents: Array<{
    title: string;
    system: "Health" | "Work" | "Relationships";
    suggestedTime: string;
    duration: number;
    priority: "high" | "medium" | "low";
    rationale: string;
  }>;
  systemAllocation: {
    health: { hoursTarget: number; percentage: number };
    work: { hoursTarget: number; percentage: number };
    relationships: { hoursTarget: number; percentage: number };
  };
  successMetrics: string[];
  confidence: number;
}

export interface ConflictResolution {
  conflicts: Array<{
    eventId: string;
    title: string;
    overlapMinutes: number;
    severity: "warning" | "blocking";
  }>;
  buffers: Array<{
    before: number;
    duration: number;
    purpose: string;
  }>;
  rescheduledEvents: Array<{
    eventId: string;
    newStartTime: number;
    newEndTime: number;
    reason: string;
  }>;
}

export interface WeeklyReflection {
  weekStartDate: string;
  weekEndDate: string;
  completionRate: number;
  systemBalance: {
    health: { planned: number; completed: number; percentage: number };
    work: { planned: number; completed: number; percentage: number };
    relationships: { planned: number; completed: number; percentage: number };
  };
  insights: string[];
  recommendations: string[];
  grade: "A" | "B" | "C" | "D" | "F";
  missedPatterns: Array<{
    eventTitle: string;
    frequency: number;
    suggestedAction: string;
  }>;
  wins: string[];
}

export interface CoachNudges {
  reminders: Array<{
    eventTitle: string;
    scheduledTime: string;
    nudgeMessage: string;
    type: "reminder";
  }>;
  habitSuggestions: Array<{
    habit: string;
    cue: string;
    routine: string;
    reward: string;
    integration: string;
  }>;
  motivationBoost: string;
  streakUpdates: Array<{
    habit: string;
    currentStreak: number;
    longestStreak: number;
    status: "active" | "at_risk" | "broken";
  }>;
}

export interface WeeklyPlan {
  generatedAt: string;
  weekStartDate: string;
  weekEndDate: string;
  userId: string;
  blueprint: WeeklyBlueprint;
  conflictResolution: ConflictResolution;
  reflection: WeeklyReflection;
  coachNudges: CoachNudges;
  executionPlan: Array<{
    day: string;
    date: string;
    events: Array<{
      title: string;
      system: "Health" | "Work" | "Relationships";
      startTime: string;
      endTime: string;
      isBuffer: boolean;
      bufferPurpose?: string;
      nudge?: string;
    }>;
  }>;
  metadata: {
    plannerConfidence: number;
    conflictCount: number;
    suggestedChanges: number;
    localAIAvailable: boolean;
  };
}

export interface OrchestrateWeeklyPlanInput {
  userId: string;
  userGoals?: {
    health?: string[];
    work?: string[];
    relationships?: string[];
  };
  weekOffset?: number;
}

export class OrchestrateWeeklyPlanUseCase {
  constructor(
    private dataService: IDataService,
    private aiService: IAIService
  ) {}

  private getWeekDates(weekOffset: number = 0): { start: Date; end: Date } {
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

  private generateExecutionPlan(
    weekStart: Date,
    weekEnd: Date,
    events: CalendarEvent[],
    blueprint: WeeklyBlueprint,
    conflictResolution: ConflictResolution,
    coachNudges: CoachNudges
  ): WeeklyPlan["executionPlan"] {
    const days: WeeklyPlan["executionPlan"] = [];
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(weekStart);
      currentDate.setDate(weekStart.getDate() + i);

      const dayEvents: Array<{
        title: string;
        system: "Health" | "Work" | "Relationships";
        startTime: string;
        endTime: string;
        isBuffer: boolean;
        bufferPurpose?: string;
        nudge?: string;
      }> = events
        .filter((e) => new Date(e.startTime).toDateString() === currentDate.toDateString())
        .map((e) => ({
          title: e.title,
          system: e.system || "Work",
          startTime: new Date(e.startTime).toISOString(),
          endTime: new Date(e.endTime || e.startTime).toISOString(),
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
          endTime: new Date(b.before + b.duration * 60000).toISOString(),
          isBuffer: true,
          bufferPurpose: b.purpose,
        });
      });

      const dayNudges = coachNudges.reminders.filter((n) => {
        const nudgeDate = new Date(n.scheduledTime);
        return nudgeDate.toDateString() === currentDate.toDateString();
      });

      dayNudges.forEach((n) => {
        const existing = dayEvents.find((e) => e.title === n.eventTitle);
        if (existing) {
          existing.nudge = n.nudgeMessage;
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

  async execute(input: OrchestrateWeeklyPlanInput): Promise<WeeklyPlan> {
    const { userId, userGoals, weekOffset = 0 } = input;
    const { start: weekStart, end: weekEnd } = this.getWeekDates(weekOffset);

    const events = await this.dataService.getEvents(userId, weekStart, weekEnd);
    const memories = await this.dataService.getMemories(userId, 50);
    const missedTasks = await this.dataService.getMissedTasks(userId, 20);
    const habitTrends = await this.dataService.getHabitTrends(userId);

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

    const plannerResult = await this.aiService.planner.createWeeklyPlan(
      `Create a weekly blueprint for week of ${weekStart.toDateString()}. ` +
      `User goals: Health - ${goals.health.join(", ")}. Work - ${goals.work.join(", ")}. ` +
      `Relationships - ${goals.relationships.join(", ")}. ` +
      `Current events: ${events.length}. Target allocation: Health ${systemAllocation.health.percentage}%, ` +
      `Work ${systemAllocation.work.percentage}%, Relationships ${systemAllocation.relationships.percentage}%.`
    );

    const blueprint: WeeklyBlueprint = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      userId,
      goals,
      plannedEvents: plannerResult.plannedEvents,
      systemAllocation,
      successMetrics: plannerResult.successMetrics,
      confidence: plannerResult.confidence,
    };

    const schedulerResult = await this.aiService.scheduler.optimizeSchedule(
      events.map((e) => ({
        id: e.id,
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime || e.startTime,
        system: e.system || "Work",
      }))
    );

    const conflictResolution: ConflictResolution = {
      conflicts: schedulerResult.conflicts,
      buffers: schedulerResult.buffers,
      rescheduledEvents: schedulerResult.rescheduled,
    };

    const completedEvents = events.filter((e) => e.completed).length;
    const totalEvents = events.length;

    const distribution: Record<string, number> = {
      Health: 0,
      Work: 0,
      Relationships: 0,
    };
    events.forEach((e) => {
      if (distribution[e.system || "Work"] !== undefined) {
        distribution[e.system || "Work"]++;
      }
    });

    const reflectionResult = await this.aiService.reflection.analyzeWeek({
      totalEvents,
      completed: completedEvents,
      missed: missedTasks.length,
      distribution,
    });

    const reflection: WeeklyReflection = {
      weekStartDate: weekStart.toISOString(),
      weekEndDate: weekEnd.toISOString(),
      completionRate: reflectionResult.completionRate,
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
      insights: reflectionResult.insights,
      recommendations: reflectionResult.recommendations,
      grade: reflectionResult.grade,
      missedPatterns: missedTasks.map((m) => ({
        eventTitle: m.eventTitle,
        frequency: m.frequency,
        suggestedAction: `Consider rescheduling or adjusting "${m.eventTitle}"`,
      })),
      wins: memories.filter((m) => m.outcome === "completed").map((m) => m.content).slice(0, 5),
    };

    const atRiskStreaks = habitTrends.filter((h) => h.streak > 0 && h.streak < 3);
    const streakStatus = (streak: number, longest: number): "active" | "at_risk" | "broken" => {
      if (streak === 0) return "broken";
      if (streak < longest * 0.3) return "at_risk";
      return "active";
    };

    const coachResult = await this.aiService.coach.assessMotivation({
      streakData: habitTrends.length > 0
        ? {
            current: habitTrends[0].streak,
            longest: habitTrends[0].longestStreak,
            atRisk: atRiskStreaks.length > 0,
          }
        : undefined,
      motivationLevel: reflection.completionRate > 70 ? 8 : reflection.completionRate > 50 ? 6 : 4,
      recentWins: reflection.wins,
      barriers: reflection.missedPatterns.map((m) => m.eventTitle),
    });

    const coachNudges: CoachNudges = {
      reminders: blueprint.plannedEvents.slice(0, 5).map((e) => ({
        eventTitle: e.title,
        scheduledTime: e.suggestedTime,
        nudgeMessage: `Time for ${e.title} - ${e.rationale}`,
        type: "reminder" as const,
      })),
      habitSuggestions: coachResult.recommendations.slice(0, 3).map((r) => ({
        habit: r.action,
        cue: r.cue,
        routine: r.action,
        reward: r.rationale,
        integration: "Add to calendar",
      })),
      motivationBoost: coachResult.motivationBoost,
      streakUpdates: habitTrends.slice(0, 5).map((h) => ({
        habit: h.habit,
        currentStreak: h.streak,
        longestStreak: h.longestStreak,
        status: streakStatus(h.streak, h.longestStreak),
      })),
    };

    const executionPlan = this.generateExecutionPlan(
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

    await this.dataService.saveWeeklyPlan(userId, weeklyPlan);

    return weeklyPlan;
  }
}