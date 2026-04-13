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
    calendarId: v.optional(v.id("shared_calendars")),
    encryptedPayload: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_calendar", ["calendarId"]),

  // Tasks table - encrypted like events
  tasks: defineTable({
    userId: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    eventId: v.optional(v.id("events")),
    encryptedPayload: v.string(),
    completed: v.boolean(),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_dueDate", ["dueDate"])
    .index("by_event", ["eventId"])
    .index("by_completed", ["completed"]),

  // Workspaces for team collaboration
  workspaces: defineTable({
    name: v.string(),
    ownerId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"]),

  // Workspace members
  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    joinedAt: v.number(),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"])
    .index("by_workspace_user", ["workspaceId", "userId"]),

  // Google Calendar credentials (encrypted)
  googleCredentials: defineTable({
    userId: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    encryptedAccessToken: v.string(),
    encryptedRefreshToken: v.string(),
    tokenExpiry: v.number(),
    calendarId: v.optional(v.string()),
    syncToken: v.optional(v.string()),
    lastSyncedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"]),

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

  shared_calendars: defineTable({
    ownerId: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"]),

  calendar_shares: defineTable({
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
    permission: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
    addedAt: v.number(),
  })
    .index("by_calendar", ["calendarId"])
    .index("by_user", ["userId"])
    .index("by_calendar_user", ["calendarId", "userId"]),

  calendar_invitations: defineTable({
    calendarId: v.id("shared_calendars"),
    email: v.string(),
    permission: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined")),
    invitedBy: v.string(),
    invitedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_calendar", ["calendarId"])
    .index("by_email", ["email"])
    .index("by_email_status", ["email", "status"]),

  calendar_presence: defineTable({
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
    userName: v.string(),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("away")),
    lastSeen: v.number(),
  })
    .index("by_calendar", ["calendarId"])
    .index("by_calendar_user", ["calendarId", "userId"]),
});
