import type {
  IAIService,
  IAIPlannerService,
  IAISchedulerService,
  AIReflectionService,
  AIBehaviorCoachService,
  PlannerResult,
  SchedulerResult,
  ReflectionResult,
  CoachResult,
} from "@/src/domain/ai/interfaces/IAIService";

class LocalAIPlanner implements IAIPlannerService {
  async createWeeklyPlan(prompt: string): Promise<PlannerResult> {
    return {
      plannedEvents: [],
      successMetrics: [],
      confidence: 0,
    };
  }
}

class LocalAIScheduler implements IAISchedulerService {
  async optimizeSchedule(events: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    system: string;
  }>): Promise<SchedulerResult> {
    return {
      conflicts: [],
      buffers: [],
      rescheduled: [],
    };
  }
}

class LocalAIReflection implements AIReflectionService {
  async analyzeWeek(stats: {
    totalEvents: number;
    completed: number;
    missed: number;
    distribution: Record<string, number>;
  }): Promise<ReflectionResult> {
    return {
      completionRate: Math.round((stats.completed / stats.totalEvents) * 100) || 0,
      insights: [],
      recommendations: [],
      grade: "C",
    };
  }
}

class LocalAIBehaviorCoach implements AIBehaviorCoachService {
  async assessMotivation(data: {
    streakData?: { current: number; longest: number; atRisk: boolean };
    motivationLevel: number;
    recentWins: string[];
    barriers: string[];
  }): Promise<CoachResult> {
    return {
      recommendations: [],
      motivationBoost: "Keep going!",
      encouragement: "Keep going!",
    };
  }
}

export class LocalAIService implements IAIService {
  planner: IAIPlannerService;
  scheduler: IAISchedulerService;
  reflection: AIReflectionService;
  coach: AIBehaviorCoachService;

  constructor() {
    this.planner = new LocalAIPlanner();
    this.scheduler = new LocalAIScheduler();
    this.reflection = new LocalAIReflection();
    this.coach = new LocalAIBehaviorCoach();
  }
}

export function createAIService(): IAIService {
  return new LocalAIService();
}