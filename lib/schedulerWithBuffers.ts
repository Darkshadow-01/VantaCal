import { ConvexHttpClient } from "convex/browser";
import { fullApi } from "../convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

async function convexQuery(functionName: string, args: Record<string, unknown>) {
  return await (convex.query as (name: string, args: Record<string, unknown>) => Promise<unknown>)(functionName, args);
}

export interface TaskDurationStats {
  eventTitle: string;
  system: string;
  samples: number;
  avgPlanned: number;
  avgActual: number;
  avgVariance: number;
  varianceStdDev: number;
  avgActualDuration: number;
  recommendedBuffer: number;
  delayProbability: number;
}

export interface DelayProneTask {
  eventTitle: string;
  system: string;
  samples: number;
  avgVariance: number;
  avgActual?: number;
  varianceStdDev: number;
  delayProbability: number;
  recommendedBuffer: number;
}

export interface DurationPrediction {
  predictedDuration: number;
  confidence: number;
  buffer: number;
  avgActual?: number;
  recentAverage?: number;
  variance?: number;
  samples?: number;
  reason: string;
}

export interface EventWithPrediction {
  id: string;
  title: string;
  system: "Health" | "Work" | "Relationships";
  startTime: number;
  endTime: number;
  plannedDuration: number;
  predictedDuration?: number;
  recommendedBuffer?: number;
  delayRisk?: "low" | "medium" | "high";
  actualEndTime?: number;
}

export interface BufferBlock {
  id: string;
  beforeEventId?: string;
  afterEventId?: string;
  startTime: number;
  endTime: number;
  duration: number;
  purpose: "transition" | "recovery" | "buffer" | "travel";
  riskReduction: number;
  recommended: boolean;
}

export interface ScheduleWithBuffers {
  events: EventWithPrediction[];
  buffers: BufferBlock[];
  totalBufferMinutes: number;
  optimizationScore: number;
  riskAssessment: {
    highRiskEvents: string[];
    recommendedBuffers: Array<{ eventTitle: string; bufferMinutes: number; reason: string }>;
  };
}

function calculateDelayRisk(variance: number, stdDev: number): "low" | "medium" | "high" {
  if (variance <= 5 && stdDev <= 10) return "low";
  if (variance <= 15 || stdDev <= 20) return "medium";
  return "high";
}

export async function getTaskDurationStats(
  userId: string,
  eventTitle?: string,
  system?: "Health" | "Work" | "Relationships"
): Promise<TaskDurationStats[]> {
  try {
    const args: Record<string, unknown> = { userId };
    if (eventTitle) args.eventTitle = eventTitle;
    if (system) args.system = system;
    args.limit = 100;

    const stats = await convexQuery("taskDurations/index.getTaskDurationStats", args);
    return (stats || []) as TaskDurationStats[];
  } catch {
    return [];
  }
}

export async function getDelayProneTasks(
  userId: string,
  minDelayProbability?: number,
  minVariance?: number
): Promise<DelayProneTask[]> {
  try {
    const args: Record<string, unknown> = { userId };
    if (minDelayProbability !== undefined) args.minDelayProbability = minDelayProbability;
    if (minVariance !== undefined) args.minVariance = minVariance;

    const tasks = await convexQuery("taskDurations/index.getDelayProneTasks", args);
    return (tasks || []) as DelayProneTask[];
  } catch {
    return [];
  }
}

export async function predictTaskDuration(
  userId: string,
  eventTitle: string
): Promise<DurationPrediction> {
  try {
    const prediction = await convexQuery("taskDurations/index.predictTaskDuration", {
      userId,
      eventTitle,
    });
    return (prediction || {
      predictedDuration: 60,
      confidence: 0,
      buffer: 15,
      reason: "No historical data",
    }) as DurationPrediction;
  } catch {
    return {
      predictedDuration: 60,
      confidence: 0,
      buffer: 15,
      reason: "Error fetching prediction",
    };
  }
}

export async function storeTaskDuration(
  userId: string,
  eventTitle: string,
  system: "Health" | "Work" | "Relationships",
  plannedDuration: number,
  actualDuration: number,
  eventId?: string
): Promise<void> {
  try {
    await (convex.mutation as (name: string, args: Record<string, unknown>) => Promise<unknown>)(
      "taskDurations/index.storeDuration",
      { userId, eventTitle, system, plannedDuration, actualDuration, eventId }
    );
  } catch (error) {
    console.error("Failed to store task duration:", error);
  }
}

function generateBufferBlocks(
  events: EventWithPrediction[],
  delayProneTasks: DelayProneTask[]
): BufferBlock[] {
  const buffers: BufferBlock[] = [];
  const delayProneMap = new Map(delayProneTasks.map(t => [t.eventTitle, t]));

  const sortedEvents = [...events].sort((a, b) => a.startTime - b.startTime);

  for (let i = 0; i < sortedEvents.length; i++) {
    const current = sortedEvents[i];
    const delayInfo = delayProneMap.get(current.title);
    
    if (delayInfo && delayInfo.delayProbability > 0.3) {
      const bufferDuration = delayInfo.recommendedBuffer || 
        Math.max(10, Math.round(delayInfo.avgVariance * 0.5));

      const bufferAfter: BufferBlock = {
        id: `buffer-after-${current.id}`,
        afterEventId: current.id,
        startTime: current.actualEndTime || (current.startTime + (delayInfo.avgActual || current.plannedDuration) * 60000),
        endTime: (current.actualEndTime || (current.startTime + (delayInfo.avgActual || current.plannedDuration) * 60000)) + bufferDuration * 60000,
        duration: bufferDuration,
        purpose: delayInfo.delayProbability > 0.6 ? "recovery" : "buffer",
        riskReduction: delayInfo.delayProbability,
        recommended: true,
      };

      buffers.push(bufferAfter);
    }

    if (i < sortedEvents.length - 1) {
      const next = sortedEvents[i + 1];
      const gap = next.startTime - (current.actualEndTime || current.endTime);
      
      const minGap = delayInfo ? delayInfo.recommendedBuffer : 5;
      
      if (gap >= minGap * 60000) {
        const transitionGap = Math.max(5, Math.round(gap / 60000));
        
        buffers.push({
          id: `buffer-transition-${current.id}`,
          afterEventId: current.id,
          beforeEventId: next.id,
          startTime: current.actualEndTime || current.endTime,
          endTime: current.actualEndTime || current.endTime,
          duration: transitionGap,
          purpose: "transition",
          riskReduction: 0.2,
          recommended: transitionGap >= 10,
        });
      }
    }

    if (delayInfo && delayInfo.avgVariance > 10) {
      buffers.push({
        id: `buffer-before-${current.id}`,
        beforeEventId: current.id,
        startTime: current.startTime - delayInfo.recommendedBuffer * 60000,
        endTime: current.startTime,
        duration: delayInfo.recommendedBuffer,
        purpose: "travel" as const,
        riskReduction: delayInfo.delayProbability * 0.5,
        recommended: true,
      });
    }
  }

  return buffers.filter(b => b.duration > 0);
}

function calculateOptimizationScore(
  events: EventWithPrediction[],
  buffers: BufferBlock[]
): number {
  if (events.length === 0) return 100;

  let score = 100;
  
  const highRiskCount = events.filter(e => e.delayRisk === "high").length;
  score -= highRiskCount * 10;
  
  const recommendedBuffers = buffers.filter(b => b.recommended);
  const coveredRisks = recommendedBuffers.length;
  const totalRisks = events.filter(e => e.delayRisk !== "low").length;
  
  if (totalRisks > 0) {
    score += (coveredRisks / totalRisks) * 20;
  }
  
  const totalBufferMinutes = buffers.reduce((sum, b) => sum + b.duration, 0);
  const totalEventMinutes = events.reduce((sum, e) => sum + e.plannedDuration, 0);
  const bufferRatio = totalEventMinutes > 0 ? totalBufferMinutes / totalEventMinutes : 0;
  
  if (bufferRatio > 0.3) {
    score -= (bufferRatio - 0.3) * 50;
  } else if (bufferRatio < 0.1 && totalRisks > 0) {
    score -= 15;
  }
  
  return Math.max(0, Math.min(100, Math.round(score)));
}

export async function analyzeScheduleWithPredictions(
  userId: string,
  events: Array<{
    id: string;
    title: string;
    system: "Health" | "Work" | "Relationships";
    startTime: number;
    endTime: number;
  }>
): Promise<ScheduleWithBuffers> {
  const durationStats = await getTaskDurationStats(userId);
  const delayProneTasks = await getDelayProneTasks(userId, 0.3, 5);
  
  const statsMap = new Map(durationStats.map(s => [s.eventTitle, s]));

  const eventsWithPredictions: EventWithPrediction[] = events.map(e => {
    const stats = statsMap.get(e.title);
    const plannedDuration = Math.round((e.endTime - e.startTime) / 60000);
    
    const prediction = stats ? {
      predictedDuration: stats.avgActualDuration || plannedDuration,
      recommendedBuffer: stats.recommendedBuffer || 0,
      delayRisk: calculateDelayRisk(stats.avgVariance, stats.varianceStdDev),
    } : {
      predictedDuration: plannedDuration,
      recommendedBuffer: 5,
      delayRisk: "low" as const,
    };

    return {
      id: e.id,
      title: e.title,
      system: e.system,
      startTime: e.startTime,
      endTime: e.endTime,
      plannedDuration,
      predictedDuration: prediction.predictedDuration,
      recommendedBuffer: prediction.recommendedBuffer,
      delayRisk: prediction.delayRisk,
      actualEndTime: e.startTime + prediction.predictedDuration * 60000,
    };
  });

  const buffers = generateBufferBlocks(eventsWithPredictions, delayProneTasks);

  const highRiskEvents = eventsWithPredictions
    .filter(e => e.delayRisk === "high")
    .map(e => e.title);

  const recommendedBuffers = delayProneTasks
    .filter(t => t.delayProbability > 0.4)
    .map(t => ({
      eventTitle: t.eventTitle,
      bufferMinutes: t.recommendedBuffer,
      reason: `${t.delayProbability * 100}% chance of overrun, avg ${t.avgVariance}min delay`,
    }));

  return {
    events: eventsWithPredictions,
    buffers,
    totalBufferMinutes: buffers.reduce((sum, b) => sum + b.duration, 0),
    optimizationScore: calculateOptimizationScore(eventsWithPredictions, buffers),
    riskAssessment: {
      highRiskEvents,
      recommendedBuffers,
    },
  };
}

export async function optimizeScheduleWithBuffers(
  userId: string,
  events: Array<{
    id: string;
    title: string;
    system: "Health" | "Work" | "Relationships";
    startTime: number;
    endTime: number;
  }>
): Promise<{
  optimizedEvents: Array<{
    title: string;
    originalStart: number;
    originalEnd: number;
    optimizedStart: number;
    optimizedEnd: number;
    bufferAdded: number;
  }>;
  suggestedBuffers: BufferBlock[];
  scheduleScore: number;
}> {
  const analysis = await analyzeScheduleWithPredictions(userId, events);

  const optimizedEvents = analysis.events.map(e => ({
    title: e.title,
    originalStart: e.startTime,
    originalEnd: e.endTime,
    optimizedStart: e.startTime,
    optimizedEnd: e.actualEndTime || e.endTime,
    bufferAdded: Math.max(0, (e.actualEndTime || e.endTime) - e.endTime) / 60000,
  }));

  return {
    optimizedEvents,
    suggestedBuffers: analysis.buffers.filter(b => b.recommended),
    scheduleScore: analysis.optimizationScore,
  };
}
