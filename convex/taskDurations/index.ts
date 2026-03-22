import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const storeDuration = mutation({
  args: {
    userId: v.string(),
    eventTitle: v.string(),
    system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
    plannedDuration: v.number(),
    actualDuration: v.number(),
    eventId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const variance = args.actualDuration - args.plannedDuration;
    
    return await ctx.db.insert("task_durations", {
      userId: args.userId,
      eventTitle: args.eventTitle,
      system: args.system,
      plannedDuration: args.plannedDuration,
      actualDuration: args.actualDuration,
      variance,
      completedAt: Date.now(),
      eventId: args.eventId,
    });
  },
});

export const getTaskDurationStats = query({
  args: {
    userId: v.string(),
    eventTitle: v.optional(v.string()),
    system: v.optional(v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query;
    
    if (args.eventTitle) {
      query = ctx.db.query("task_durations").withIndex("by_eventTitle", (q) =>
        q.eq("eventTitle", args.eventTitle!)
      );
    } else if (args.system) {
      query = ctx.db.query("task_durations").withIndex("by_user_system", (q) =>
        q.eq("userId", args.userId).eq("system", args.system!)
      );
    } else {
      query = ctx.db.query("task_durations").withIndex("by_user", (q) =>
        q.eq("userId", args.userId)
      );
    }

    const results = await query.collect();
    const limited = args.limit ? results.slice(0, args.limit) : results;

    const statsMap = new Map<string, {
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
    }>();

    for (const d of limited) {
      if (!statsMap.has(d.eventTitle)) {
        statsMap.set(d.eventTitle, {
          eventTitle: d.eventTitle,
          system: d.system,
          samples: 0,
          avgPlanned: 0,
          avgActual: 0,
          avgVariance: 0,
          varianceStdDev: 0,
          avgActualDuration: 0,
          recommendedBuffer: 0,
          delayProbability: 0,
        });
      }

      const stats = statsMap.get(d.eventTitle)!;
      stats.samples++;
      stats.avgPlanned += d.plannedDuration;
      stats.avgActual += d.actualDuration;
      stats.avgVariance += d.variance;
    }

    const durationsByEvent: Map<string, number[]> = new Map();
    for (const d of limited) {
      if (!durationsByEvent.has(d.eventTitle)) {
        durationsByEvent.set(d.eventTitle, []);
      }
      durationsByEvent.get(d.eventTitle)!.push(d.variance);
    }

    for (const [title, stats] of statsMap) {
      const durations = durationsByEvent.get(title) || [];
      const mean = stats.avgVariance / stats.samples;
      
      const squaredDiffs = durations.map(v => Math.pow(v - mean, 2));
      const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / durations.length;
      stats.varianceStdDev = Math.sqrt(avgSquaredDiff);

      stats.avgPlanned = Math.round(stats.avgPlanned / stats.samples);
      stats.avgActual = Math.round(stats.avgActual / stats.samples);
      stats.avgVariance = Math.round(mean);
      stats.avgActualDuration = Math.round(stats.avgActual);
      
      stats.recommendedBuffer = Math.max(
        Math.round(stats.varianceStdDev * 0.5),
        Math.round(mean * 0.2)
      );
      
      stats.delayProbability = Math.min(
        1,
        durations.filter(v => v > 0).length / durations.length
      );
    }

    return Array.from(statsMap.values());
  },
});

export const getDelayProneTasks = query({
  args: {
    userId: v.string(),
    minDelayProbability: v.optional(v.number()),
    minVariance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("task_durations").withIndex("by_user", (q) =>
      q.eq("userId", args.userId)
    ).collect();

    const statsMap = new Map<string, {
      eventTitle: string;
      system: string;
      samples: number;
      avgVariance: number;
      varianceStdDev: number;
      delayProbability: number;
      recommendedBuffer: number;
    }>();

    for (const d of results) {
      if (!statsMap.has(d.eventTitle)) {
        statsMap.set(d.eventTitle, {
          eventTitle: d.eventTitle,
          system: d.system,
          samples: 0,
          avgVariance: 0,
          varianceStdDev: 0,
          delayProbability: 0,
          recommendedBuffer: 0,
        });
      }

      const stats = statsMap.get(d.eventTitle)!;
      stats.samples++;
      stats.avgVariance += d.variance;
    }

    const durationsByEvent: Map<string, number[]> = new Map();
    for (const d of results) {
      if (!durationsByEvent.has(d.eventTitle)) {
        durationsByEvent.set(d.eventTitle, []);
      }
      durationsByEvent.get(d.eventTitle)!.push(d.variance);
    }

    const minProb = args.minDelayProbability ?? 0.3;
    const minVar = args.minVariance ?? 5;

    for (const [title, stats] of statsMap) {
      if (stats.samples < 2) continue;

      const durations = durationsByEvent.get(title) || [];
      const mean = stats.avgVariance / stats.samples;
      
      const squaredDiffs = durations.map(v => Math.pow(v - mean, 2));
      const avgSquaredDiff = squaredDiffs.length > 0 
        ? squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length 
        : 0;
      stats.varianceStdDev = Math.sqrt(avgSquaredDiff);
      stats.avgVariance = Math.round(mean);
      
      stats.delayProbability = Math.min(
        1,
        durations.filter(v => v > 0).length / durations.length
      );
      
      stats.recommendedBuffer = Math.max(
        Math.round(stats.varianceStdDev * 0.5),
        Math.round(mean * 0.25)
      );

      if (stats.delayProbability < minProb || stats.avgVariance < minVar) {
        statsMap.delete(title);
      }
    }

    return Array.from(statsMap.values())
      .filter(s => s.delayProbability >= minProb || s.avgVariance >= minVar)
      .sort((a, b) => b.delayProbability - a.delayProbability);
  },
});

export const predictTaskDuration = query({
  args: {
    userId: v.string(),
    eventTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db.query("task_durations").withIndex("by_eventTitle", (q) =>
      q.eq("eventTitle", args.eventTitle)
    ).collect();

    if (results.length === 0) {
      return {
        predictedDuration: 60,
        confidence: 0,
        buffer: 15,
        reason: "No historical data",
      };
    }

    const durations = results.map(d => d.actualDuration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    
    const squaredDiffs = durations.map(v => Math.pow(v - avg, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / durations.length);
    
    const recentResults = results
      .sort((a, b) => b.completedAt - a.completedAt)
      .slice(0, 5);
    const recentAvg = recentResults.reduce((a, b) => a + b.actualDuration, 0) / recentResults.length;

    const predictedDuration = Math.round((avg + recentAvg) / 2);
    const confidence = Math.min(1, results.length / 10);
    const buffer = Math.max(
      Math.round(stdDev * 0.5),
      Math.round(predictedDuration * 0.15)
    );

    return {
      predictedDuration,
      confidence,
      buffer,
      avgActual: Math.round(avg),
      recentAverage: Math.round(recentAvg),
      variance: Math.round(stdDev),
      samples: results.length,
      reason: results.length < 3 ? "Limited data" : "Based on historical patterns",
    };
  },
});
