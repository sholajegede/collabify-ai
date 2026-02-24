import { ConvexError, v } from "convex/values";
import { internalMutation, internalQuery, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const createUser = internalMutation({
  args: {
    kindeId: v.string(),
    email: v.string(),
    name: v.string(),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, { kindeId, email, name, givenName, familyName, picture }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", kindeId))
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("users", {
      kindeId,
      email,
      name,
      givenName,
      familyName,
      picture,
    });
  },
});

export const updateUser = internalMutation({
  args: {
    kindeId: v.string(),
    email: v.string(),
    name: v.string(),
    givenName: v.optional(v.string()),
    familyName: v.optional(v.string()),
    picture: v.optional(v.string()),
  },
  handler: async (ctx, { kindeId, email, name, givenName, familyName, picture }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", kindeId))
      .unique();

    if (!user) throw new ConvexError("User not found");

    await ctx.db.patch(user._id, { email, name, givenName, familyName, picture });
  },
});

export const deleteUser = internalMutation({
  args: { kindeId: v.string() },
  handler: async (ctx, { kindeId }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", kindeId))
      .unique();

    if (!user) throw new ConvexError("User not found");

    await ctx.db.delete(user._id);
  },
});

export const getUserByKindeId = internalQuery({
  args: { kindeId: v.string() },
  handler: async (ctx, { kindeId }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_kindeId", (q) => q.eq("kindeId", kindeId))
      .unique();
  },
});

export const getMe = query({
  args: {},
  handler: async (ctx) => {
    try {
      return await getCurrentUser(ctx);
    } catch {
      return null;
    }
  },
});