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

export class MockAIPlanner implements IAIPlannerService {
  private shouldFail = false;
  private result: PlannerResult = { plannedEvents: [], successMetrics: [], confidence: 0.5 };

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setResult(result: PlannerResult): void {
    this.result = result;
  }

  async createWeeklyPlan(prompt: string): Promise<PlannerResult> {
    if (this.shouldFail) {
      throw new Error("Mock AI failure");
    }
    return this.result;
  }
}

export class MockAIScheduler implements IAISchedulerService {
  private shouldFail = false;
  private result: SchedulerResult = { conflicts: [], buffers: [], rescheduled: [] };

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setResult(result: SchedulerResult): void {
    this.result = result;
  }

  async optimizeSchedule(events: Array<{
    id: string;
    title: string;
    startTime: number;
    endTime: number;
    system: string;
  }>): Promise<SchedulerResult> {
    if (this.shouldFail) {
      throw new Error("Mock AI failure");
    }
    return this.result;
  }
}

export class MockAIReflection implements AIReflectionService {
  private shouldFail = false;
  private result: ReflectionResult = { completionRate: 0, insights: [], recommendations: [], grade: "C" };

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setResult(result: ReflectionResult): void {
    this.result = result;
  }

  async analyzeWeek(stats: {
    totalEvents: number;
    completed: number;
    missed: number;
    distribution: Record<string, number>;
  }): Promise<ReflectionResult> {
    if (this.shouldFail) {
      throw new Error("Mock AI failure");
    }
    return this.result;
  }
}

export class MockAIBehaviorCoach implements AIBehaviorCoachService {
  private shouldFail = false;
  private result: CoachResult = { recommendations: [], motivationBoost: "Keep going!", encouragement: "Keep going!" };

  setShouldFail(fail: boolean): void {
    this.shouldFail = fail;
  }

  setResult(result: CoachResult): void {
    this.result = result;
  }

  async assessMotivation(data: {
    streakData?: { current: number; longest: number; atRisk: boolean };
    motivationLevel: number;
    recentWins: string[];
    barriers: string[];
  }): Promise<CoachResult> {
    if (this.shouldFail) {
      throw new Error("Mock AI failure");
    }
    return this.result;
  }
}

export class MockAIService implements IAIService {
  planner: IAIPlannerService;
  scheduler: IAISchedulerService;
  reflection: AIReflectionService;
  coach: AIBehaviorCoachService;

  constructor() {
    this.planner = new MockAIPlanner();
    this.scheduler = new MockAIScheduler();
    this.reflection = new MockAIReflection();
    this.coach = new MockAIBehaviorCoach();
  }

  getPlanner(): MockAIPlanner {
    return this.planner as MockAIPlanner;
  }

  getScheduler(): MockAIScheduler {
    return this.scheduler as MockAIScheduler;
  }

  getReflection(): MockAIReflection {
    return this.reflection as MockAIReflection;
  }

  getCoach(): MockAIBehaviorCoach {
    return this.coach as MockAIBehaviorCoach;
  }
}

export function createMockAIService(): IAIService {
  return new MockAIService();
}