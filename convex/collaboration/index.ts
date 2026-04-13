import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

const ACTIVE_USER_TTL = 60000;

export const updatePresence = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
    userName: v.string(),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("away")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendar_presence")
      .withIndex("by_calendar_user", (q) => 
        q.eq("calendarId", args.calendarId).eq("userId", args.userId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        lastSeen: Date.now(),
        userName: args.userName,
      });
    } else {
      await ctx.db.insert("calendar_presence", {
        calendarId: args.calendarId,
        userId: args.userId,
        userName: args.userName,
        status: args.status,
        lastSeen: Date.now(),
      });
    }

    return true;
  },
});

export const getActiveUsers = query({
  args: {
    calendarId: v.id("shared_calendars"),
  },
  handler: async (ctx, args) => {
    const allPresence = await ctx.db
      .query("calendar_presence")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    const now = Date.now();
    return allPresence
      .filter((p) => now - p.lastSeen < ACTIVE_USER_TTL)
      .map((p) => ({
        userId: p.userId,
        userName: p.userName,
        status: p.status,
        lastSeen: p.lastSeen,
      }));
  },
});

export const broadcastUpdate = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    type: v.string(),
    userId: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    return {
      type: args.type,
      calendarId: args.calendarId,
      userId: args.userId,
      timestamp: Date.now(),
      data: args.data,
    };
  },
});