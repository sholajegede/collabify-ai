import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";

export const ping = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", documentId).eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now() });
    } else {
      await ctx.db.insert("presence", {
        documentId,
        userId: user._id,
        lastSeen: Date.now(),
      });
    }
  },
});

export const leave = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", documentId).eq("userId", user._id)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getActive = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const cutoff = Date.now() - 60_000;

    const records = await ctx.db
      .query("presence")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const active = records.filter((r) => r.lastSeen > cutoff);

    return Promise.all(
      active.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        return {
          userId: r.userId,
          name: user?.name ?? "Unknown",
          lastSeen: r.lastSeen,
        };
      })
    );
  },
});

export const cleanupStale = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 5 * 60_000;

    const stale = await ctx.db
      .query("presence")
      .withIndex("by_last_seen", (q) => q.lt("lastSeen", cutoff))
      .collect();

    await Promise.all(stale.map((r) => ctx.db.delete(r._id)));
    return { deleted: stale.length };
  },
});