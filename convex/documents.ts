import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, requireOrganizationAccess } from "./lib/auth";
import {
  requireDocumentAccess,
  resolveDocumentAccess,
} from "./lib/documentAccess";
import { paginationOptsValidator } from "convex/server";

export const listPaginated = query({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { organizationId, paginationOpts }) => {
    await requireOrganizationAccess(ctx, organizationId);

    return ctx.db
      .query("documents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireOrganizationAccess(ctx, organizationId);

    return ctx.db
      .query("documents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .order("desc")
      .collect();
  },
});

export const get = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const access = await resolveDocumentAccess(ctx, documentId, user._id);
    if (!access) return null;

    const doc = await ctx.db.get(documentId);
    if (!doc) return null;

    return {
      ...doc,
      permissions: access.permissions,
      accessSource: access.source,
    };
  },
});

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    title: v.string(),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { organizationId, title, content }) => {
    await requireOrganizationAccess(ctx, organizationId);
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const trimmed = title.trim();
    if (!trimmed) throw new Error("Title cannot be empty");
    if (trimmed.length > 200) throw new Error("Title is too long");

    return ctx.db.insert("documents", {
      organizationId,
      title: trimmed,
      content: content ?? "",
      createdBy: user._id,
      lastModifiedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
  },
  handler: async (ctx, { documentId, title, content }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireDocumentAccess(ctx, documentId, user._id, "edit");

    const patch: Record<string, unknown> = { lastModifiedAt: Date.now() };

    if (title !== undefined) {
      const t = title.trim();
      if (!t) throw new Error("Title cannot be empty");
      if (t.length > 200) throw new Error("Title is too long");
      patch.title = t;
    }

    if (content !== undefined) {
      if (content.length > 500_000) {
        throw new Error("Document content cannot exceed 500,000 characters");
      }
      patch.content = content;
    }

    await ctx.db.patch(documentId, patch);
    return { success: true };
  },
});

export const remove = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);

    // Only org admins/owners may permanently delete documents
    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    const { membership } = await requireOrganizationAccess(
      ctx,
      doc.organizationId
    );
    if (!["owner", "admin"].includes(membership.role)) {
      throw new Error("Only admins and owners can permanently delete documents");
    }

    // Clean up all related records atomically
    const [shares, versions, presenceRecords] = await Promise.all([
      ctx.db
        .query("documentShares")
        .withIndex("by_document", (q) => q.eq("documentId", documentId))
        .collect(),
      ctx.db
        .query("documentVersions")
        .withIndex("by_document", (q) => q.eq("documentId", documentId))
        .collect(),
      ctx.db
        .query("presence")
        .withIndex("by_document", (q) => q.eq("documentId", documentId))
        .collect(),
    ]);

    await Promise.all([
      ...shares.map((s) => ctx.db.delete(s._id)),
      ...versions.map((v) => ctx.db.delete(v._id)),
      ...presenceRecords.map((p) => ctx.db.delete(p._id)),
      ctx.db.delete(documentId),
    ]);

    return { success: true };
  },
});

export const listSharedWithMe = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const shares = await ctx.db
      .query("documentShares")
      .withIndex("by_shared_with", (q) =>
        q.eq("sharedWithUserId", user._id)
      )
      .collect();

    const now = Date.now();

    const results = await Promise.all(
      shares.map(async (share) => {
        // Skip expired shares
        if (share.expiresAt !== undefined && share.expiresAt < now) return null;

        const doc = await ctx.db.get(share.documentId);
        if (!doc) return null;

        const org = await ctx.db.get(doc.organizationId);
        const sharedBy = await ctx.db.get(share.sharedByUserId);

        return {
          ...doc,
          permissions: share.permissions,
          sharedByName: sharedBy?.name ?? "Someone",
          organizationName: org?.name ?? "Unknown organization",
          organizationSlug: org?.slug ?? "",
          accessCount: share.accessCount,
          lastAccessedAt: share.lastAccessedAt,
        };
      })
    );

    return results
      .filter((d): d is NonNullable<typeof d> => d !== null)
      .sort((a, b) => b.lastModifiedAt - a.lastModifiedAt);
  },
});