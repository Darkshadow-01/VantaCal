import type { CalendarEvent } from "@/src/domain/calendar/event";

export interface PlannerResult {
  plannedEvents: Array<{
    title: string;
    system: "Health" | "Work" | "Relationships";
    suggestedTime: string;
    duration: number;
    priority: "high" | "medium" | "low";
    rationale: string;
  }>;
  successMetrics: string[];
  confidence: number;
}

export interface SchedulerResult {
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
  rescheduled: Array<{
    eventId: string;
    newStartTime: number;
    newEndTime: number;
    reason: string;
  }>;
}

export interface ReflectionResult {
  completionRate: number;
  insights: string[];
  recommendations: string[];
  grade: "A" | "B" | "C" | "D" | "F";
}

export interface CoachResult {
  recommendations: Array<{
    action: string;
    cue: string;
    rationale: string;
  }>;
  motivationBoost: string;
  encouragement: string;
}

export interface IAIPlannerService {
  createWeeklyPlan(prompt: string): Promise<PlannerResult>;
}

export interface IAISchedulerService {
  optimizeSchedule(events: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    system: string;
  }>): Promise<SchedulerResult>;
}

export interface AIReflectionService {
  analyzeWeek(stats: {
    totalEvents: number;
    completed: number;
    missed: number;
    distribution: Record<string, number>;
  }): Promise<ReflectionResult>;
}

export interface AIBehaviorCoachService {
  assessMotivation(data: {
    streakData?: { current: number; longest: number; atRisk: boolean };
    motivationLevel: number;
    recentWins: string[];
    barriers: string[];
  }): Promise<CoachResult>;
}

export interface IAIService {
  planner: IAIPlannerService;
  scheduler: IAISchedulerService;
  reflection: AIReflectionService;
  coach: AIBehaviorCoachService;
}