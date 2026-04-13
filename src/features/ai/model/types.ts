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
    eventTitle: string;
    conflictingEvents: string[];
    resolution: string;
    suggestedTime: string;
  }>;
  buffers: Array<{
    before: string;
    after: string;
    duration: number;
    purpose: string;
  }>;
  rescheduledEvents: Array<{
    originalTitle: string;
    newTime: string;
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
    type: "reminder" | "encouragement" | "barrier_prep";
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