import { v } from "convex/values";
import { query } from "./_generated/server";
import { requirePermission } from "./lib/auth";

export const listForDocument = query({
  args: {
    organizationId: v.id("organizations"),
    documentId: v.id("documents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, documentId, limit }) => {
    await requirePermission(ctx, organizationId, "documents:manage");

    const logs = await ctx.db
      .query("accessLogs")
      .withIndex("by_resource", (q) =>
        q.eq("resourceType", "document").eq("resourceId", documentId)
      )
      .order("desc")
      .take(limit ?? 50);

    return logs;
  },
});