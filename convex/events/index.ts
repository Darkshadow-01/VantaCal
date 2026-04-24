import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createEvent = mutation({
  args: {
    userId: v.string(),
    calendarId: v.optional(v.id("shared_calendars")),
    encryptedPayload: v.string(),
    syncStatus: v.optional(v.union(v.literal("saving"), v.literal("saved"), v.literal("failed"))),
    isEncrypted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const eventId = await ctx.db.insert("events", {
      userId: args.userId,
      calendarId: args.calendarId,
      encryptedPayload: args.encryptedPayload,
      syncStatus: args.syncStatus || "saving",
      lastSyncedAt: now,
      isEncrypted: args.isEncrypted || false,
      createdAt: now,
      updatedAt: now,
    });
    // Update sync status to saved
    await ctx.db.patch(eventId, { syncStatus: "saved" as "saving" | "saved" | "failed" });
    return eventId;
  },
});

export const updateEvent = mutation({
  args: {
    eventId: v.id("events"),
    encryptedPayload: v.optional(v.string()),
    syncStatus: v.optional(v.union(v.literal("saving"), v.literal("saved"), v.literal("failed"))),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { 
      updatedAt: Date.now(),
      syncStatus: args.syncStatus || "saving",
      lastSyncedAt: Date.now(),
    };
    if (args.encryptedPayload) {
      updates.encryptedPayload = args.encryptedPayload;
    }
    await ctx.db.patch(args.eventId, updates);
    // Update sync status to saved after successful update
    await ctx.db.patch(args.eventId, { syncStatus: "saved" as "saving" | "saved" | "failed" });
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

export const getCalendarEvents = query({
  args: {
    calendarId: v.id("shared_calendars"),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();
    return events;
  },
});

export const getSharedCalendarEvents = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Fetch user's own events (single query)
    const userEvents = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Get all calendar shares for this user (single query)
    const calendarShares = await ctx.db
      .query("calendar_shares")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Extract unique calendar IDs
    const calendarIds = [...new Set(calendarShares.map((share) => share.calendarId))];

    if (calendarIds.length === 0) {
      return userEvents;
    }

    // Batch fetch all events and filter by calendarId in memory
    // More efficient than N separate queries
    const allEvents = await ctx.db.query("events").collect();

    const sharedEvents = allEvents.filter((event) =>
      event.calendarId && calendarIds.includes(event.calendarId)
    );

    return [...userEvents, ...sharedEvents];
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
    userId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found");

    let eventTitle = "Untitled Event";
    let system: "Health" | "Work" | "Relationships" = "Work";

    try {
      const payload = JSON.parse(event.encryptedPayload);
      eventTitle = payload.title || "Untitled Event";
      system = payload.system || "Work";
    } catch {
      // Keep defaults if decryption fails
    }

    const missedTaskId = await ctx.db.insert("missed_tasks", {
      userId: args.userId,
      eventId: args.eventId,
      eventTitle,
      system,
      missedAt: Date.now(),
      reason: args.reason || "未指定",
      wasRescheduled: false,
    });

    return { success: true, missedTaskId };
  },
});

export const checkAndLogConflict = mutation({
  args: {
    userId: v.string(),
    startTime: v.number(),
    endTime: v.number(),
    excludeEventId: v.optional(v.id("events")),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const conflicts: Array<{ eventId: string; title: string; startTime: number; endTime: number }> = [];

    for (const event of events) {
      if (args.excludeEventId && event._id === args.excludeEventId) continue;

      let eventStart = 0;
      let eventEnd = 0;
      let eventTitle = "Untitled";

      try {
        const payload = JSON.parse(event.encryptedPayload);
        eventStart = payload.startTime || 0;
        eventEnd = payload.endTime || 0;
        eventTitle = payload.title || "Untitled";
      } catch {
        continue;
      }

      const overlaps =
        (args.startTime >= eventStart && args.startTime < eventEnd) ||
        (args.endTime > eventStart && args.endTime <= eventEnd) ||
        (args.startTime <= eventStart && args.endTime >= eventEnd);

      if (overlaps) {
        conflicts.push({
          eventId: event._id,
          title: eventTitle,
          startTime: eventStart,
          endTime: eventEnd,
        });
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  },
});

export const migrateEventEncryption = mutation({
  args: {
    eventId: v.id("events"),
    encryptedPayload: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      encryptedPayload: args.encryptedPayload,
      isEncrypted: true,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

export const getUnencryptedEvents = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("events")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return events.filter((e) => !e.isEncrypted);
  },
});

export const markEventSyncFailed = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      syncStatus: "failed" as "saving" | "saved" | "failed",
    });
    return { success: true };
  },
});

export const retryEventSync = mutation({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.eventId, {
      syncStatus: "saving" as "saving" | "saved" | "failed",
    });
    return { success: true };
  },
});
