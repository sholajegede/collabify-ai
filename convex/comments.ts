import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { requireDocumentAccess, hasPermission } from "./lib/documentAccess";

export const list = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    try {
      await requireDocumentAccess(ctx, documentId, user._id, "view");
    } catch {
      return [];
    }

    return ctx.db
      .query("comments")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .order("asc")
      .collect();
  },
});

export const add = mutation({
  args: {
    documentId: v.id("documents"),
    content: v.string(),
  },
  handler: async (ctx, { documentId, content }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    // requireDocumentAccess returns { permissions, source } — use that directly
    const access = await requireDocumentAccess(ctx, documentId, user._id, "view");

    if (!hasPermission(access.permissions, "comment")) {
      throw new Error("You do not have permission to comment on this document");
    }

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Comment cannot be empty");
    if (trimmed.length > 2000) throw new Error("Comment cannot exceed 2000 characters");

    return ctx.db.insert("comments", {
      documentId,
      authorId: user._id,
      authorName: user.name,
      authorPicture: user.picture,
      content: trimmed,
      createdAt: Date.now(),
      resolved: false,
    });
  },
});

export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    const access = await requireDocumentAccess(ctx, comment.documentId, user._id, "view");
    const isAuthor = comment.authorId === user._id;
    const canModerate = hasPermission(access.permissions, "edit");

    if (!isAuthor && !canModerate) {
      throw new Error("You cannot delete this comment");
    }

    await ctx.db.delete(commentId);
  },
});

export const resolve = mutation({
  args: { commentId: v.id("comments"), resolved: v.boolean() },
  handler: async (ctx, { commentId, resolved }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    const access = await requireDocumentAccess(ctx, comment.documentId, user._id, "view");
    const isAuthor = comment.authorId === user._id;
    const canEdit = hasPermission(access.permissions, "edit");

    if (!isAuthor && !canEdit) {
      throw new Error("You cannot resolve this comment");
    }

    await ctx.db.patch(commentId, { resolved });
  },
});