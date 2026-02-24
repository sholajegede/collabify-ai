import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");
    return await ctx.storage.getUrl(storageId);
  },
});