/**
 * Meeting Requests - Convex Backend Functions
 * Handles creation and management of team meeting requests
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Create a meeting request and associated events
 */
export const create = mutation({
  args: {
    organizerId: v.string(),
    workspaceId: v.id("workspaces"),
    title: v.string(),
    durationMinutes: v.number(),
    scheduledStartTime: v.number(),
    scheduledEndTime: v.number(),
    attendeeIds: v.array(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    availabilityScore: v.number(),
    wasOptimalSlot: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create meeting request record
    const meetingRequestId = await ctx.db.insert("meeting_requests", {
      organizerId: args.organizerId,
      workspaceId: args.workspaceId,
      title: args.title,
      durationMinutes: args.durationMinutes,
      scheduledStartTime: args.scheduledStartTime,
      scheduledEndTime: args.scheduledEndTime,
      attendeeIds: args.attendeeIds,
      acceptedAttendees: [args.organizerId], // Organizer auto-accepts
      declinedAttendees: [],
      availabilityScore: args.availabilityScore,
      wasOptimalSlot: args.wasOptimalSlot,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });

    return { meetingRequestId };
  },
});

/**
 * Get meeting requests for a workspace
 */
export const getByWorkspace = query({
  args: {
    workspaceId: v.id("workspaces"),
    status: v.optional(v.union(v.literal("pending"), v.literal("scheduled"), v.literal("cancelled"))),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("meeting_requests")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId));

    const requests = await q.collect();

    if (args.status) {
      return requests.filter(r => r.status === args.status);
    }

    return requests;
  },
});

/**
 * Accept a meeting invitation
 */
export const accept = mutation({
  args: {
    meetingRequestId: v.id("meeting_requests"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const meetingRequest = await ctx.db.get(args.meetingRequestId);
    if (!meetingRequest) {
      throw new Error("Meeting request not found");
    }

    const acceptedAttendees = meetingRequest.acceptedAttendees.includes(args.userId)
      ? meetingRequest.acceptedAttendees
      : [...meetingRequest.acceptedAttendees, args.userId];

    const declinedAttendees = meetingRequest.declinedAttendees.filter(id => id !== args.userId);

    await ctx.db.patch(args.meetingRequestId, {
      acceptedAttendees,
      declinedAttendees,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Decline a meeting invitation
 */
export const decline = mutation({
  args: {
    meetingRequestId: v.id("meeting_requests"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const meetingRequest = await ctx.db.get(args.meetingRequestId);
    if (!meetingRequest) {
      throw new Error("Meeting request not found");
    }

    const declinedAttendees = meetingRequest.declinedAttendees.includes(args.userId)
      ? meetingRequest.declinedAttendees
      : [...meetingRequest.declinedAttendees, args.userId];

    const acceptedAttendees = meetingRequest.acceptedAttendees.filter(id => id !== args.userId);

    await ctx.db.patch(args.meetingRequestId, {
      acceptedAttendees,
      declinedAttendees,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Cancel a meeting request
 */
export const cancel = mutation({
  args: {
    meetingRequestId: v.id("meeting_requests"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.meetingRequestId, {
      status: "cancelled",
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
