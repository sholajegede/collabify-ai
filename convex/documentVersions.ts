import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./lib/auth";
import { requireDocumentAccess } from "./lib/documentAccess";

export const save = mutation({
  args: {
    documentId: v.id("documents"),
    changeDescription: v.optional(v.string()),
  },
  handler: async (ctx, { documentId, changeDescription }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireDocumentAccess(ctx, documentId, user._id, "edit");

    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    const existing = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const nextVersion =
      existing.length > 0
        ? Math.max(...existing.map((v) => v.version)) + 1
        : 1;

    await ctx.db.insert("documentVersions", {
      documentId,
      version: nextVersion,
      title: doc.title,
      content: doc.content,
      createdBy: user._id,
      changeDescription,
    });

    return { version: nextVersion };
  },
});

export const list = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireDocumentAccess(ctx, documentId, user._id, "view");

    const versions = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    const withUsers = await Promise.all(
      versions.map(async (v) => {
        const author = await ctx.db.get(v.createdBy);
        return { ...v, authorName: author?.name ?? "Unknown" };
      })
    );

    return withUsers.sort((a, b) => b.version - a.version);
  },
});

export const restore = mutation({
  args: { versionId: v.id("documentVersions") },
  handler: async (ctx, { versionId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const version = await ctx.db.get(versionId);
    if (!version) throw new Error("Version not found");

    await requireDocumentAccess(ctx, version.documentId, user._id, "edit");

    const doc = await ctx.db.get(version.documentId);
    if (!doc) throw new Error("Document not found");

    const existing = await ctx.db
      .query("documentVersions")
      .withIndex("by_document", (q) => q.eq("documentId", version.documentId))
      .collect();

    const nextVersion =
      existing.length > 0
        ? Math.max(...existing.map((v) => v.version)) + 1
        : 1;

    // Snapshot current state before overwriting
    await ctx.db.insert("documentVersions", {
      documentId: version.documentId,
      version: nextVersion,
      title: doc.title,
      content: doc.content,
      createdBy: user._id,
      changeDescription: `Auto-saved before restoring version ${version.version}`,
    });

    await ctx.db.patch(version.documentId, {
      title: version.title,
      content: version.content,
      lastModifiedAt: Date.now(),
    });

    return { success: true };
  },
});
