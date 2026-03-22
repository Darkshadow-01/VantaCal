import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  user_keys: defineTable({
    userId: v.string(),
    encryptedMasterKey: v.string(),
    salt: v.string(),
    iv: v.string(),
    recoveryEncryptedMasterKey: v.optional(v.string()),
    recoverySalt: v.optional(v.string()),
    recoveryIv: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_userId", ["userId"]),

  systems: defineTable({
    userId: v.string(),
    encryptedPayload: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  events: defineTable({
    userId: v.string(),
    encryptedPayload: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  memories: defineTable({
    userId: v.string(),
    encryptedPayload: v.string(),
    importance: v.number(),
    accessCount: v.number(),
    lastAccessed: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
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

  task_durations: defineTable({
    userId: v.string(),
    eventTitle: v.string(),
    system: v.union(v.literal("Health"), v.literal("Work"), v.literal("Relationships")),
    plannedDuration: v.number(),
    actualDuration: v.number(),
    variance: v.number(),
    completedAt: v.number(),
    eventId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_eventTitle", ["eventTitle"])
    .index("by_user_system", ["userId", "system"]),

  weekly_plans: defineTable({
    userId: v.string(),
    weekStart: v.number(),
    weekEnd: v.number(),
    planData: v.object({
      blueprint: v.object({
        weekStartDate: v.string(),
        weekEndDate: v.string(),
        userId: v.string(),
        goals: v.object({
          health: v.array(v.string()),
          work: v.array(v.string()),
          relationships: v.array(v.string()),
        }),
        plannedEvents: v.array(v.object({
          title: v.string(),
          system: v.string(),
          suggestedTime: v.string(),
          duration: v.number(),
          priority: v.string(),
          rationale: v.string(),
        })),
        systemAllocation: v.object({
          health: v.object({ hoursTarget: v.number(), percentage: v.number() }),
          work: v.object({ hoursTarget: v.number(), percentage: v.number() }),
          relationships: v.object({ hoursTarget: v.number(), percentage: v.number() }),
        }),
        successMetrics: v.array(v.string()),
        confidence: v.number(),
      }),
      conflictResolution: v.object({
        conflicts: v.array(v.object({
          eventTitle: v.string(),
          conflictingEvents: v.array(v.string()),
          resolution: v.string(),
          suggestedTime: v.string(),
        })),
        buffers: v.array(v.object({
          before: v.string(),
          after: v.string(),
          duration: v.number(),
          purpose: v.string(),
        })),
        rescheduledEvents: v.array(v.object({
          originalTitle: v.string(),
          newTime: v.string(),
          reason: v.string(),
        })),
      }),
      reflection: v.object({
        weekStartDate: v.string(),
        weekEndDate: v.string(),
        completionRate: v.number(),
        systemBalance: v.object({
          health: v.object({ planned: v.number(), completed: v.number(), percentage: v.number() }),
          work: v.object({ planned: v.number(), completed: v.number(), percentage: v.number() }),
          relationships: v.object({ planned: v.number(), completed: v.number(), percentage: v.number() }),
        }),
        insights: v.array(v.string()),
        recommendations: v.array(v.string()),
        grade: v.string(),
        missedPatterns: v.array(v.object({
          eventTitle: v.string(),
          frequency: v.number(),
          suggestedAction: v.string(),
        })),
        wins: v.array(v.string()),
      }),
      coachNudges: v.object({
        reminders: v.array(v.object({
          eventTitle: v.string(),
          scheduledTime: v.string(),
          nudgeMessage: v.string(),
          type: v.string(),
        })),
        habitSuggestions: v.array(v.object({
          habit: v.string(),
          cue: v.string(),
          routine: v.string(),
          reward: v.string(),
          integration: v.string(),
        })),
        motivationBoost: v.string(),
        streakUpdates: v.array(v.object({
          habit: v.string(),
          currentStreak: v.number(),
          longestStreak: v.number(),
          status: v.string(),
        })),
      }),
      executionPlan: v.array(v.object({
        day: v.string(),
        date: v.string(),
        events: v.array(v.object({
          title: v.string(),
          system: v.string(),
          startTime: v.string(),
          endTime: v.string(),
          isBuffer: v.boolean(),
          bufferPurpose: v.optional(v.string()),
          nudge: v.optional(v.string()),
        })),
      })),
      metadata: v.object({
        plannerConfidence: v.number(),
        conflictCount: v.number(),
        suggestedChanges: v.number(),
        localAIAvailable: v.boolean(),
      }),
    }),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_week", ["userId", "weekStart"]),
});
