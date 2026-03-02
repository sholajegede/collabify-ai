import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser, logAccess } from "./lib/auth";
import {
  requireDocumentAccess,
  hasPermission,
} from "./lib/documentAccess";

export const share = mutation({
  args: {
    documentId: v.id("documents"),
    email: v.string(),
    permissions: v.array(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, { documentId, email, permissions, expiresAt }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const doc = await ctx.db.get(documentId);
    if (!doc) throw new Error("Document not found");

    // Only org members can share outward — a user who only has access via
    // a share record cannot forward that access to anyone else
    const sharerMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", doc.organizationId).eq("userId", user._id)
      )
      .unique();

    if (!sharerMembership) {
      throw new Error(
        "Only organization members can share documents with external users."
      );
    }

    if (!["owner", "admin", "member"].includes(sharerMembership.role)) {
      throw new Error("Viewers cannot share documents.");
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail.length > 254) {
      throw new Error("Invalid email address");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Invalid email address");
    }

    if (normalizedEmail === user.email.toLowerCase()) {
      throw new Error("You cannot share a document with yourself");
    }

    const validPermissions = ["view", "comment", "edit"];
    const unknown = permissions.filter((p) => !validPermissions.includes(p));
    if (unknown.length > 0) {
      throw new Error(`Unknown permission(s): ${unknown.join(", ")}`);
    }
    if (permissions.length === 0) {
      throw new Error("At least one permission is required");
    }

    const targetUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (!targetUser) {
      throw new Error(
        "No account found with that email address. They must sign up first."
      );
    }

    // Check the *target* user's membership separately
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q
          .eq("organizationId", doc.organizationId)
          .eq("userId", targetUser._id)
      )
      .unique();

    if (targetMembership) {
      throw new Error(
        "This person is already an organization member and has access through their role."
      );
    }

    const existing = await ctx.db
      .query("documentShares")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", documentId).eq("sharedWithUserId", targetUser._id)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { permissions, expiresAt });
      return { success: true, updated: true };
    }

    await ctx.db.insert("documentShares", {
      documentId,
      sharedWithUserId: targetUser._id,
      sharedByUserId: user._id,
      permissions,
      expiresAt,
      accessCount: 0,
    });

    return { success: true, updated: false };
  },
});

export const listForDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requireDocumentAccess(ctx, documentId, user._id, "view");

    const shares = await ctx.db
      .query("documentShares")
      .withIndex("by_document", (q) => q.eq("documentId", documentId))
      .collect();

    return Promise.all(
      shares.map(async (share) => {
        const sharedWith = await ctx.db.get(share.sharedWithUserId);
        const sharedBy = await ctx.db.get(share.sharedByUserId);
        const isExpired =
          share.expiresAt !== undefined && share.expiresAt < Date.now();

        return {
          ...share,
          sharedWithName: sharedWith?.name ?? "Unknown",
          sharedWithEmail: sharedWith?.email ?? "",
          sharedByName: sharedBy?.name ?? "Unknown",
          isExpired,
        };
      })
    );
  },
});

export const updatePermissions = mutation({
  args: {
    shareId: v.id("documentShares"),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, { shareId, permissions }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const share = await ctx.db.get(shareId);
    if (!share) throw new Error("Share not found");

    await requireDocumentAccess(ctx, share.documentId, user._id, "edit");

    const validPermissions = ["view", "comment", "edit"];
    const unknown = permissions.filter((p) => !validPermissions.includes(p));
    if (unknown.length > 0) {
      throw new Error(`Unknown permission(s): ${unknown.join(", ")}`);
    }
    if (permissions.length === 0) {
      throw new Error("At least one permission is required");
    }

    await ctx.db.patch(shareId, { permissions });
    return { success: true };
  },
});

export const revoke = mutation({
  args: { shareId: v.id("documentShares") },
  handler: async (ctx, { shareId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const share = await ctx.db.get(shareId);
    if (!share) throw new Error("Share not found");

    await requireDocumentAccess(ctx, share.documentId, user._id, "edit");

    await ctx.db.delete(shareId);
    return { success: true };
  },
});

// Called when a shared user opens a document — increments access tracking
export const recordAccess = mutation({
  args: { shareId: v.id("documentShares") },
  handler: async (ctx, { shareId }) => {
    const share = await ctx.db.get(shareId);
    if (!share) return;

    await ctx.db.patch(shareId, {
      lastAccessedAt: Date.now(),
      accessCount: share.accessCount + 1,
    });

    await logAccess(ctx, {
      userId: share.sharedWithUserId,
      resourceType: "document",
      resourceId: shareId,
      action: "view",
      metadata: { sharedAccess: true },
    });
  },
});

export const getShareForCurrentUser = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx, { documentId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    return ctx.db
      .query("documentShares")
      .withIndex("by_document_and_user", (q) =>
        q.eq("documentId", documentId).eq("sharedWithUserId", user._id)
      )
      .unique();
  },
});