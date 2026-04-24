/**
 * Team Schedules - Convex Backend Functions
 * Manages team member preferences for scheduling
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get or create team schedule preferences for a user
 */
export const getOrCreate = query({
  args: {
    userId: v.string(),
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("team_schedules")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      return existing;
    }

    // Return default preferences (will be created on first save)
    return {
      userId: args.userId,
      workspaceId: args.workspaceId,
      workingHoursStart: 9,
      workingHoursEnd: 17,
      workingDaysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
      focusTimeEnabled: false,
      focusTimeStart: undefined,
      focusTimeEnd: undefined,
      autoAcceptMeetings: true,
      minNoticeMinutes: 30,
      maxMeetingsPerDay: undefined,
    };
  },
});

/**
 * Update team schedule preferences
 */
export const update = mutation({
  args: {
    userId: v.string(),
    workspaceId: v.id("workspaces"),
    workingHoursStart: v.optional(v.number()),
    workingHoursEnd: v.optional(v.number()),
    workingDaysOfWeek: v.optional(v.array(v.number())),
    focusTimeEnabled: v.optional(v.boolean()),
    focusTimeStart: v.optional(v.number()),
    focusTimeEnd: v.optional(v.number()),
    autoAcceptMeetings: v.optional(v.boolean()),
    minNoticeMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, workspaceId, ...updates } = args;
    const now = Date.now();

    const existing = await ctx.db
      .query("team_schedules")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...updates,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const newId = await ctx.db.insert("team_schedules", {
        userId,
        workspaceId,
        workingHoursStart: 9,
        workingHoursEnd: 17,
        workingDaysOfWeek: [1, 2, 3, 4, 5],
        focusTimeEnabled: false,
        autoAcceptMeetings: true,
        minNoticeMinutes: 30,
        createdAt: now,
        updatedAt: now,
        ...updates,
      });
      return newId;
    }
  },
});

/**
 * Get all team members' preferences for a workspace
 */
export const getTeamPreferences = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query("team_schedules")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    // Enrich with user names
    const enriched = await Promise.all(
      schedules.map(async (schedule) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", schedule.userId))
          .first();

        return {
          ...schedule,
          userName: user?.name || user?.email || "Unknown",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get workspace team members
 */
export const getTeamMembers = query({
  args: {
    workspaceId: v.id("workspaces"),
  },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .collect();

    const enriched = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_userId", (q) => q.eq("userId", member.userId))
          .first();

        return {
          userId: member.userId,
          email: user?.email || "",
          name: user?.name || "",
          role: member.role,
          imageUrl: user?.imageUrl,
        };
      })
    );

    return enriched;
  },
});
