import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const storeMemory = mutation({
  args: {
    userId: v.string(),
    encryptedPayload: v.string(),
    importance: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const memoryId = await ctx.db.insert("memories", {
      userId: args.userId,
      encryptedPayload: args.encryptedPayload,
      importance: args.importance,
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
      updatedAt: now,
    });
    return memoryId;
  },
});

export const storeEpisodicEvent = mutation({
  args: {
    userId: v.string(),
    encryptedPayload: v.string(),
    eventId: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const memoryId = await ctx.db.insert("memories", {
      userId: args.userId,
      encryptedPayload: args.encryptedPayload,
      importance: 0.8,
      accessCount: 0,
      lastAccessed: now,
      createdAt: now,
      updatedAt: now,
    });
    return memoryId;
  },
});

export const storePattern = mutation({
  args: {
    userId: v.string(),
    patternType: v.union(v.literal("time"), v.literal("frequency"), v.literal("conflict"), v.literal("system_balance")),
    description: v.string(),
    system: v.optional(v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships"))),
    insight: v.string(),
    confidence: v.number(),
    actionableSteps: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const patternId = await ctx.db.insert("patterns", {
      userId: args.userId,
      patternType: args.patternType,
      description: args.description,
      frequency: 1,
      system: args.system,
      insight: args.insight,
      confidence: args.confidence,
      actionableSteps: args.actionableSteps,
      createdAt: now,
      updatedAt: now,
    });
    return patternId;
  },
});

export const getMemories = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("memories")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const sortedResults = [...results].sort((a, b) => {
      const scoreA = a.importance * (1 + a.accessCount * 0.1);
      const scoreB = b.importance * (1 + b.accessCount * 0.1);
      return scoreB - scoreA;
    });

    return args.limit ? sortedResults.slice(0, args.limit) : sortedResults;
  },
});

export const getMissedTasks = query({
  args: {
    userId: v.string(),
    system: v.optional(v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("missed_tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.system) {
      results = results.filter((m) => m.system === args.system);
    }

    results.sort((a, b) => b.missedAt - a.missedAt);

    const mapped = results.map((m) => ({
      ...m,
      frequency: results.filter((x) => x.eventTitle === m.eventTitle).length,
    }));

    return args.limit ? mapped.slice(0, args.limit) : mapped;
  },
});

export const getHabitTrends = query({
  args: {
    userId: v.string(),
    system: v.optional(v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships"))),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("habit_tracks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.system) {
      results = results.filter((h) => h.system === args.system);
    }

    return results.sort((a, b) => b.streak - a.streak);
  },
});

export const getPatterns = query({
  args: {
    userId: v.string(),
    patternType: v.optional(
      v.union(v.literal("time"), v.literal("frequency"), v.literal("conflict"), v.literal("system_balance"))
    ),
    minConfidence: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db
      .query("patterns")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.patternType) {
      results = results.filter((p) => p.patternType === args.patternType);
    }

    if (args.minConfidence) {
      results = results.filter((p) => p.confidence >= args.minConfidence!);
    }

    return results.sort((a, b) => b.confidence - a.confidence);
  },
});

export const updateHabitTrack = mutation({
  args: {
    habit: v.string(),
    userId: v.string(),
    system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    // Fetch all tracks for user and filter by habit name
    const existingTracks = await ctx.db
      .query("habit_tracks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const existing = existingTracks.find((track) => track.habit === args.habit);

    if (existing) {
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];
      const completedDates = [...existing.completedDates];

      if (args.completed && !completedDates.includes(today)) {
        completedDates.push(today);
        const streak = existing.streak + 1;
        const longestStreak = Math.max(existing.longestStreak, streak);

        await ctx.db.patch(existing._id, {
          completedDates,
          streak,
          longestStreak,
          totalCompletions: existing.totalCompletions + 1,
          completionRate: completedDates.length / 30,
          lastCompleted: now,
        });

        return existing._id;
      }
    } else {
      const now = Date.now();
      const today = new Date().toISOString().split("T")[0];

      return await ctx.db.insert("habit_tracks", {
        userId: args.userId,
        habit: args.habit,
        system: args.system,
        completedDates: args.completed ? [today] : [],
        streak: args.completed ? 1 : 0,
        longestStreak: args.completed ? 1 : 0,
        totalCompletions: args.completed ? 1 : 0,
        completionRate: args.completed ? 1 / 30 : 0,
        lastCompleted: args.completed ? now : undefined,
        createdAt: now,
      });
    }
  },
});
