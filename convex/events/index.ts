import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createEvent = mutation({
  args: {
    userId: v.string(),
    encryptedPayload: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      userId: args.userId,
      encryptedPayload: args.encryptedPayload,
      createdAt: now,
      updatedAt: now,
    });
    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    encryptedPayload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.encryptedPayload) {
      updates.encryptedPayload = args.encryptedPayload;
    }
    await ctx.db.patch(args.eventId, updates);
    return args.eventId;
  },
});

export const deleteEvent = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.eventId);
    return args.eventId;
  },
});

export const getEvents = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return [];
    }
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId!))
      .collect();
    return events;
  },
});

export const getEventById = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.eventId);
  },
});

export const markEventMissed = mutation({
  args: {
    eventId: v.id("events"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    return args.eventId;
  },
});

export const checkAndLogConflict = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return { hasConflict: false, conflicts: [] };
  },
});
