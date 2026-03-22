import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const create = mutation({
  args: {
    userId: v.string(),
    weekStart: v.number(),
    weekEnd: v.number(),
    planData: v.any(),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("weekly_plans")
      .withIndex("by_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", args.weekStart)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        planData: args.planData,
        createdAt: args.createdAt,
      });
      return existing._id;
    }

    return await ctx.db.insert("weekly_plans", {
      userId: args.userId,
      weekStart: args.weekStart,
      weekEnd: args.weekEnd,
      planData: args.planData,
      createdAt: args.createdAt,
    });
  },
});

export const getByWeek = query({
  args: {
    userId: v.string(),
    weekStart: v.number(),
    weekEnd: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("weekly_plans")
      .withIndex("by_week", (q) =>
        q.eq("userId", args.userId).eq("weekStart", args.weekStart)
      )
      .collect();
  },
});

export const getRecent = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const plans = await ctx.db
      .query("weekly_plans")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return plans
      .sort((a, b) => b.weekStart - a.weekStart)
      .slice(0, args.limit || 4);
  },
});

export const getById = query({
  args: {
    id: v.id("weekly_plans"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
