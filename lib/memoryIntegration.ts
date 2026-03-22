import {
  useMemories,
  useMissedTasks,
  useHabitTrends,
  usePatterns,
  useStoreEpisodicEvent,
  useStorePattern,
  useUpdateHabitTrack,
  type Memory,
  type HabitTrack,
  type Pattern,
  type System,
  type HabitOutcome,
} from "./memory";

export interface MemoryContext {
  memories: Memory[];
  missedTasks: Array<{ eventTitle: string; frequency: number; system: System }>;
  habitTrends: HabitTrack[];
  patterns: Pattern[];
}

export function useSchedulerContext(
  userId: string,
  system?: System
) {
  const missedTasks = useMissedTasks(userId, system, 10);
  const patterns = usePatterns(userId, "conflict", 0.7);
  const habitTrends = useHabitTrends(userId, system);

  return {
    missedTasks: missedTasks || [],
    conflictPatterns: patterns || [],
    habitTrends: habitTrends || [],
    conflictWarning:
      missedTasks && missedTasks.length > 0
        ? `User has missed "${missedTasks[0].eventTitle}" ${missedTasks[0].frequency} times. Consider suggesting alternative times.`
        : undefined,
    habitReminder:
      habitTrends && habitTrends.length > 0
        ? `Active habits: ${habitTrends.map((h) => `${h.habit} (${h.streak} day streak)`).join(", ")}`
        : undefined,
  };
}

export function useReflectionContext(userId: string) {
  const memories = useMemories(userId, undefined, undefined, 20);
  const missedTasks = useMissedTasks(userId, undefined, 10);
  const patterns = usePatterns(userId, undefined, 0.6);
  const habitTrends = useHabitTrends(userId);

  const weeklyInsight = generateWeeklyInsight(memories, missedTasks, patterns, habitTrends);
  const systemBalanceAnalysis = analyzeSystemBalance(memories, patterns);

  return {
    memories: memories || [],
    missedTasks: missedTasks || [],
    patterns: patterns || [],
    habitTrends: habitTrends || [],
    weeklyInsight,
    systemBalanceAnalysis,
    recommendations: generateRecommendations(memories, missedTasks, patterns, habitTrends),
  };
}

function generateWeeklyInsight(
  memories: Memory[] | undefined,
  missedTasks: any[] | undefined,
  patterns: Pattern[] | undefined,
  habitTrends: HabitTrack[] | undefined
): string {
  const completedCount = memories?.filter((m) => m.category.includes("completed")).length || 0;
  const missedCount = missedTasks?.length || 0;
  const activeStreaks = habitTrends?.filter((h) => h.streak > 0).length || 0;

  return `This week: ${completedCount} events completed, ${missedCount} missed tasks, ${activeStreaks} active habit streaks.`;
}

function analyzeSystemBalance(memories: Memory[] | undefined, patterns: Pattern[] | undefined): string {
  const systemCounts: Record<System, number> = { Health: 0, Work: 0, Relationships: 0 };

  memories?.forEach((m) => {
    if (m.metadata?.system) {
      systemCounts[m.metadata.system as System]++;
    }
  });

  const total = Object.values(systemCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return "No data available for system balance analysis.";

  const balance = Object.entries(systemCounts)
    .map(([sys, count]) => `${sys}: ${Math.round((count / total) * 100)}%`)
    .join(", ");

  const imbalance = patterns?.find((p) => p.patternType === "system_balance");
  if (imbalance) {
    return `System allocation: ${balance}. Insight: ${imbalance.insight}`;
  }

  return `System allocation: ${balance}.`;
}

function generateRecommendations(
  memories: Memory[] | undefined,
  missedTasks: any[] | undefined,
  patterns: Pattern[] | undefined,
  habitTrends: HabitTrack[] | undefined
): string[] {
  const recommendations: string[] = [];

  const frequentMisses = missedTasks?.filter((m) => (m.frequency || 0) >= 2) || [];
  if (frequentMisses.length > 0) {
    recommendations.push(
      `Consider rescheduling recurring tasks: ${frequentMisses
        .map((m) => `"${m.eventTitle}"`)
        .join(", ")} - these are frequently missed.`
    );
  }

  const brokenStreaks = habitTrends?.filter((h) => h.streak === 0 && h.longestStreak > 7) || [];
  if (brokenStreaks.length > 0) {
    recommendations.push(
      `Help rebuild these habits: ${brokenStreaks
        .map((h) => `${h.habit} (previously ${h.longestStreak} days)`)
        .join(", ")}`
    );
  }

  const highConfidencePatterns = patterns?.filter((p) => p.confidence >= 0.8) || [];
  highConfidencePatterns.forEach((p) => {
    if (p.actionableSteps.length > 0) {
      recommendations.push(`${p.insight}. Suggested action: ${p.actionableSteps[0]}`);
    }
  });

  return recommendations;
}

export async function logEventOutcome(
  userId: string,
  eventId: string,
  eventTitle: string,
  system: System,
  outcome: HabitOutcome,
  storeEpisodicEvent: any,
  confidence: number = 1
) {
  await storeEpisodicEvent({
    userId,
    eventTitle,
    system,
    eventId,
    outcome,
    tags: [system.toLowerCase(), outcome],
    confidence,
  });
}

export async function recordPattern(
  userId: string,
  patternType: Pattern["patternType"],
  description: string,
  system: System | undefined,
  insight: string,
  confidence: number,
  actionableSteps: string[],
  storePattern: any
) {
  await storePattern({
    userId,
    patternType,
    description,
    system,
    insight,
    confidence,
    actionableSteps,
  });
}
