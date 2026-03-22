import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createSystem = mutation({
  args: {
    userId: v.string(),
    encryptedPayload: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const systemId = await ctx.db.insert("systems", {
      userId: args.userId,
      encryptedPayload: args.encryptedPayload,
      createdAt: now,
      updatedAt: now,
    });
    return systemId;
  },
});

export const getSystems = query({
  args: {
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return [];
    }
    return await ctx.db
      .query("systems")
      .withIndex("by_user", (q) => q.eq("userId", args.userId!))
      .collect();
  },
});

export const updateSystem = mutation({
  args: {
    systemId: v.id("systems"),
    encryptedPayload: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.encryptedPayload) {
      updates.encryptedPayload = args.encryptedPayload;
    }
    await ctx.db.patch(args.systemId, updates);
    return args.systemId;
  },
});
