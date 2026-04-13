import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createSharedCalendar = mutation({
  args: {
    ownerId: v.string(),
    name: v.string(),
    color: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const calendarId = await ctx.db.insert("shared_calendars", {
      ownerId: args.ownerId,
      name: args.name,
      color: args.color,
      description: args.description,
      isDefault: args.isDefault || false,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("calendar_shares", {
      calendarId,
      userId: args.ownerId,
      permission: "admin",
      addedAt: now,
    });

    return calendarId;
  },
});

export const updateSharedCalendar = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.name) updates.name = args.name;
    if (args.color) updates.color = args.color;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.calendarId, updates);
    return args.calendarId;
  },
});

export const deleteSharedCalendar = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
  },
  handler: async (ctx, args) => {
    // Delete all calendar shares
    const shares = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    for (const share of shares) {
      await ctx.db.delete(share._id);
    }

    // Delete all calendar invitations
    const invitations = await ctx.db
      .query("calendar_invitations")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    for (const invite of invitations) {
      await ctx.db.delete(invite._id);
    }

    // Delete all events associated with this calendar
    const calendarEvents = await ctx.db
      .query("events")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    for (const event of calendarEvents) {
      await ctx.db.delete(event._id);
    }

    // Delete the calendar itself
    await ctx.db.delete(args.calendarId);
    return args.calendarId;
  },
});

export const getSharedCalendars = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get all shares for user (single query)
    const shares = await ctx.db
      .query("calendar_shares")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (shares.length === 0) return [];

    // Extract calendar IDs
    const calendarIds = shares.map((share) => share.calendarId);

    // Batch fetch all calendars at once (single query)
    const allCalendars = await ctx.db.query("shared_calendars").collect();

    // Filter to only the calendars we need using a Map for O(1) lookup
    const calendarMap = new Map(allCalendars.map((cal) => [cal._id, cal]));

    // Combine shares with calendar data
    return shares
      .map((share) => {
        const calendar = calendarMap.get(share.calendarId);
        if (!calendar) return null;

        return {
          ...calendar,
          permission: share.permission,
          isOwner: share.permission === "admin",
        };
      })
      .filter(Boolean);
  },
});

export const getCalendarById = query({
  args: {
    calendarId: v.id("shared_calendars"),
  },
  handler: async (ctx, args) => {
    const calendar = await ctx.db.get(args.calendarId);
    if (!calendar) return null;

    const shares = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    return {
      ...calendar,
      shares: shares,
      memberCount: shares.length,
    };
  },
});

export const inviteToCalendar = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    email: v.string(),
    permission: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
    invitedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("calendar_invitations")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .filter((q) => q.eq(q.field("calendarId"), args.calendarId))
      .first();

    if (existing) {
      return existing._id;
    }

    const invitationId = await ctx.db.insert("calendar_invitations", {
      calendarId: args.calendarId,
      email: args.email.toLowerCase(),
      permission: args.permission,
      status: "pending",
      invitedBy: args.invitedBy,
      invitedAt: Date.now(),
    });

    return invitationId;
  },
});

export const respondToInvitation = mutation({
  args: {
    invitationId: v.id("calendar_invitations"),
    userId: v.string(),
    response: v.union(v.literal("accepted"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    const invitation = await ctx.db.get(args.invitationId);
    if (!invitation || invitation.status !== "pending") {
      return null;
    }

    await ctx.db.patch(args.invitationId, {
      status: args.response,
      respondedAt: Date.now(),
    });

    if (args.response === "accepted") {
      const calendar = await ctx.db.get(invitation.calendarId);
      if (calendar) {
        await ctx.db.insert("calendar_shares", {
          calendarId: invitation.calendarId,
          userId: args.userId,
          permission: invitation.permission,
          addedAt: Date.now(),
        });
      }
    }

    return args.invitationId;
  },
});

export const getUserInvitations = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const allInvitations = await ctx.db
      .query("calendar_invitations")
      .filter((q) => 
        q.and(
          q.eq(q.field("email"), args.email.toLowerCase()),
          q.eq(q.field("status"), "pending")
        )
      )
      .collect();

    const enrichedInvitations = [];
    for (const invite of allInvitations) {
      const calendar = await ctx.db.get(invite.calendarId);
      if (calendar) {
        enrichedInvitations.push({
          ...invite,
          calendarName: calendar.name,
          calendarColor: calendar.color,
          calendarDescription: calendar.description,
        });
      }
    }

    return enrichedInvitations;
  },
});

export const removeUserFromCalendar = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar_user", (q) => 
        q.eq("calendarId", args.calendarId).eq("userId", args.userId)
      )
      .first();

    if (share && share.permission !== "admin") {
      await ctx.db.delete(share._id);
      return true;
    }

    return false;
  },
});

export const updateUserPermission = mutation({
  args: {
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
    permission: v.union(v.literal("view"), v.literal("edit"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar_user", (q) => 
        q.eq("calendarId", args.calendarId).eq("userId", args.userId)
      )
      .first();

    if (share) {
      await ctx.db.patch(share._id, { permission: args.permission });
      return share._id;
    }

    return null;
  },
});

export const getCalendarMembers = query({
  args: {
    calendarId: v.id("shared_calendars"),
  },
  handler: async (ctx, args) => {
    const shares = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar", (q) => q.eq("calendarId", args.calendarId))
      .collect();

    const members = [];
    for (const share of shares) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", share.userId))
        .first();

      members.push({
        ...share,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "",
        userImage: user?.imageUrl || "",
      });
    }

    return members;
  },
});

export const canUserAccessCalendar = query({
  args: {
    calendarId: v.id("shared_calendars"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const share = await ctx.db
      .query("calendar_shares")
      .withIndex("by_calendar_user", (q) => 
        q.eq("calendarId", args.calendarId).eq("userId", args.userId)
      )
      .first();

    return share ? { allowed: true, permission: share.permission } : { allowed: false, permission: null };
  },
});