import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getCurrentUser } from "./lib/auth";
import { requireDocumentAccess } from "./lib/documentAccess";

export const analyze = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireDocumentAccess(ctx, documentId, user._id, "view");

    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    if (!doc.content || doc.content.trim().length < 20) {
      throw new Error(
        "Document is too short to analyze. Add some content first."
      );
    }

    const recentAnalyses = await ctx.db
      .query("accessLogs")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", doc.organizationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("action"), "ai_analyze"),
          q.gt(q.field("timestamp"), Date.now() - 60_000)
        )
      )
      .collect();

    const org = await ctx.db.get(doc.organizationId);
    const limit = org?.settings.maxJobsPerMinute ?? 10;

    if (recentAnalyses.length >= limit) {
      throw new Error(
        `Rate limit exceeded. You can run up to ${limit} analyses per minute. Please wait a moment and try again.`
      );
    }

    await ctx.db.insert("accessLogs", {
      userId: user._id,
      resourceType: "document",
      resourceId: documentId,
      action: "ai_analyze",
      organizationId: doc.organizationId,
      timestamp: Date.now(),
    });

    // Clear any previous analysis so the UI shows the spinner correctly
    await ctx.db.patch(documentId, {
      aiAnalysis: undefined,
    });

    // Schedule the action and return immediately to the frontend
    await ctx.scheduler.runAfter(0, internal.actions.ai.analyzeDocument, {
      documentId,
      title: doc.title,
      content: doc.content,
    });

    return { success: true };
  },
});

export const saveAnalysis = internalMutation({
  args: {
    documentId: v.id("documents"),
    summary: v.string(),
    keywords: v.array(v.string()),
    sentiment: v.string(),
  },
  handler: async (ctx, { documentId, summary, keywords, sentiment }) => {
    await ctx.db.patch(documentId, {
      aiAnalysis: {
        summary,
        keywords,
        sentiment,
        processedAt: Date.now(),
      },
      lastModifiedAt: Date.now(),
    });
  },
});