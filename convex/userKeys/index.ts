import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const getUserKeys = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("user_keys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const createUserKeys = mutation({
  args: {
    userId: v.string(),
    encryptedMasterKey: v.string(),
    salt: v.string(),
    iv: v.string(),
    recoveryEncryptedMasterKey: v.optional(v.string()),
    recoverySalt: v.optional(v.string()),
    recoveryIv: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_keys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedMasterKey: args.encryptedMasterKey,
        salt: args.salt,
        iv: args.iv,
        recoveryEncryptedMasterKey: args.recoveryEncryptedMasterKey,
        recoverySalt: args.recoverySalt,
        recoveryIv: args.recoveryIv,
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    const now = Date.now();
    const keyId = await ctx.db.insert("user_keys", {
      userId: args.userId,
      encryptedMasterKey: args.encryptedMasterKey,
      salt: args.salt,
      iv: args.iv,
      recoveryEncryptedMasterKey: args.recoveryEncryptedMasterKey,
      recoverySalt: args.recoverySalt,
      recoveryIv: args.recoveryIv,
      createdAt: now,
      updatedAt: now,
    });
    return keyId;
  },
});

export const updateUserKeys = mutation({
  args: {
    userId: v.string(),
    encryptedMasterKey: v.string(),
    salt: v.string(),
    iv: v.string(),
    recoveryEncryptedMasterKey: v.optional(v.string()),
    recoverySalt: v.optional(v.string()),
    recoveryIv: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_keys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        encryptedMasterKey: args.encryptedMasterKey,
        salt: args.salt,
        iv: args.iv,
        recoveryEncryptedMasterKey: args.recoveryEncryptedMasterKey,
        recoverySalt: args.recoverySalt,
        recoveryIv: args.recoveryIv,
        updatedAt: Date.now(),
      });
      return existing._id;
    }
    return null;
  },
});

export const deleteUserKeys = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("user_keys")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return existing._id;
    }
    return null;
  },
});
