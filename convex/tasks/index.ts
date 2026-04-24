import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createTask = mutation({
  args: {
    userId: v.string(),
    workspaceId: v.optional(v.id("workspaces")),
    eventId: v.optional(v.id("events")),
    encryptedPayload: v.string(),
    completed: v.boolean(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const taskId = await ctx.db.insert("tasks", {
      userId: args.userId,
      workspaceId: args.workspaceId,
      eventId: args.eventId,
      encryptedPayload: args.encryptedPayload,
      completed: args.completed,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });
    return taskId;
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    encryptedPayload: v.optional(v.string()),
    completed: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.encryptedPayload) updates.encryptedPayload = args.encryptedPayload;
    if (args.completed !== undefined) updates.completed = args.completed;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    
    await ctx.db.patch(args.taskId, updates);
    return args.taskId;
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
    return args.taskId;
  },
});

export const getTasks = query({
  args: {
    userId: v.optional(v.string()),
    workspaceId: v.optional(v.id("workspaces")),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) {
      return [];
    }
    
    const q = ctx.db.query("tasks").withIndex("by_user", (q) => q.eq("userId", args.userId!));
    
    const tasks = await q.collect();
    
    let filtered = tasks;
    if (args.workspaceId) {
      filtered = filtered.filter(t => t.workspaceId === args.workspaceId);
    }
    if (args.completed !== undefined) {
      filtered = filtered.filter(t => t.completed === args.completed);
    }
    
    return filtered;
  },
});

export const getTaskById = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

export const getTasksByEvent = query({
  args: {
    eventId: v.id("events"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .collect();
  },
});

export const getTasksDueSoon = query({
  args: {
    userId: v.string(),
    daysAhead: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const daysAhead = args.daysAhead || 7;
    const futureDate = now + daysAhead * 24 * 60 * 60 * 1000;
    
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    return tasks.filter(t => 
      !t.completed && 
      t.dueDate && 
      t.dueDate >= now && 
      t.dueDate <= futureDate
    );
  },
});
