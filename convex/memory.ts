import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  memories: defineTable({
    userId: v.string(),
    type: v.union(v.literal("episodic"), v.literal("semantic"), v.literal("procedural")),
    category: v.string(),
    content: v.string(),
    embedding: v.optional(v.array(v.float64())),
    metadata: v.optional(v.object({
      system: v.optional(v.string()),
      eventId: v.optional(v.string()),
      confidence: v.optional(v.float64()),
      source: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
    })),
    importance: v.number(),
    accessCount: v.number(),
    lastAccessed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_category", ["category"])
    .index("by_user_type", ["userId", "type"])
    .index("by_importance", ["importance"]),

  habit_tracks: defineTable({
    userId: v.string(),
    habit: v.string(),
    system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
    completedDates: v.array(v.string()),
    streak: v.number(),
    longestStreak: v.number(),
    totalCompletions: v.number(),
    completionRate: v.number(),
    lastCompleted: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_streak", ["streak"]),

  missed_tasks: defineTable({
    userId: v.string(),
    eventId: v.string(),
    eventTitle: v.string(),
    system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
    missedAt: v.number(),
    reason: v.optional(v.string()),
    wasRescheduled: v.boolean(),
  })
    .index("by_user", ["userId"])
    .index("by_system", ["system"])
    .index("by_missedAt", ["missedAt"]),

  patterns: defineTable({
    userId: v.string(),
    patternType: v.union(
      v.literal("time"),
      v.literal("frequency"),
      v.literal("conflict"),
      v.literal("system_balance")
    ),
    description: v.string(),
    frequency: v.number(),
    system: v.optional(v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships"))),
    insight: v.string(),
    confidence: v.number(),
    actionableSteps: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_type", ["patternType"])
    .index("by_confidence", ["confidence"]),
});
