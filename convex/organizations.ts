import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getCurrentUser,
  requireOrganizationAccess,
  checkPermission,
} from "./lib/auth";
import { getRolePermissions } from "./lib/permissions";
import type { Permission } from "./lib/permissions";
import { requirePermission } from "./lib/auth";
import { paginationOptsValidator } from "convex/server";

export const getMembersPaginated = query({
  args: {
    organizationId: v.id("organizations"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { organizationId, paginationOpts }) => {
    await requireOrganizationAccess(ctx, organizationId);

    const page = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .paginate(paginationOpts);

    const membersWithUsers = await Promise.all(
      page.page.map(async ({ userId, role, joinedAt }) => {
        const user = await ctx.db.get(userId);
        return {
          userId: user!._id,
          name: user!.name,
          email: user!.email,
          picture: user!.picture,
          role,
          joinedAt,
        };
      })
    );

    const roleOrder: Record<string, number> = {
      owner: 0,
      admin: 1,
      member: 2,
      viewer: 3,
    };

    return {
      ...page,
      page: membersWithUsers.sort(
        (a, b) =>
          (roleOrder[a.role] ?? 4) - (roleOrder[b.role] ?? 4) ||
          a.joinedAt - b.joinedAt
      ),
    };
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) return [];

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    return Promise.all(
      memberships.map(async ({ organizationId, role, joinedAt }) => {
        const org = await ctx.db.get(organizationId);
        return { ...org!, role, joinedAt };
      })
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!org) return null;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", org._id).eq("userId", user._id)
      )
      .unique();

    if (!membership) throw new Error("Access denied");

    return { ...org, role: membership.role, joinedAt: membership.joinedAt };
  },
});

export const getMembers = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await requireOrganizationAccess(ctx, organizationId);

    const memberships = await ctx.db
      .query("organizationMembers")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .collect();

    const members = await Promise.all(
      memberships.map(async ({ userId, role, joinedAt }) => {
        const user = await ctx.db.get(userId);
        return {
          userId: user!._id,
          name: user!.name,
          email: user!.email,
          picture: user!.picture,
          role,
          joinedAt,
        };
      })
    );

    // Owners first, then by join date
    const roleOrder: Record<string, number> = {
      owner: 0,
      admin: 1,
      member: 2,
      viewer: 3,
    };
    return members.sort(
      (a, b) =>
        (roleOrder[a.role] ?? 4) - (roleOrder[b.role] ?? 4) ||
        a.joinedAt - b.joinedAt
    );
  },
});

export const create = mutation({
  args: { name: v.string(), slug: v.string() },
  handler: async (ctx, { name, slug }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    if (name.trim().length === 0) throw new Error("Name cannot be empty");
    if (name.trim().length > 100)
      throw new Error("Name cannot exceed 100 characters");

    if (slug.length > 50) throw new Error("Slug cannot exceed 50 characters");
    if (!/^[a-z0-9-]+$/.test(slug)) {
      throw new Error(
        "Slug must contain only lowercase letters, numbers, and hyphens"
      );
    }
    // Prevent slugs that would collide with Next.js routes
    const reservedSlugs = [
      "api",
      "dashboard",
      "invite",
      "admin",
      "static",
      "_next",
    ];
    if (reservedSlugs.includes(slug)) {
      throw new Error("That slug is reserved. Please choose a different one.");
    }

    const existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (existing) throw new Error("Organization slug already taken");

    const orgId = await ctx.db.insert("organizations", {
      name,
      slug,
      ownerId: user._id,
      settings: {
        allowInvitations: true,
        defaultMemberRole: "member",
        maxStorageMB: 1024,
        maxJobsPerMinute: 10,
      },
    });

    await ctx.db.insert("organizationMembers", {
      organizationId: orgId,
      userId: user._id,
      role: "owner",
      joinedAt: Date.now(),
    });

    return orgId;
  },
});

export const checkUserPermission = query({
  args: { organizationId: v.id("organizations"), permission: v.string() },
  handler: async (ctx, { organizationId, permission }) => {
    return checkPermission(ctx, organizationId, permission as Permission);
  },
});

export const getMyPermissions = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const { membership } = await requireOrganizationAccess(ctx, organizationId);
    return {
      role: membership.role,
      permissions: getRolePermissions(membership.role),
    };
  },
});

export const getOrgOverview = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const user = await getCurrentUser(ctx);
    if (!user) return null;

    const org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();

    if (!org) return null;

    const membership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", org._id).eq("userId", user._id)
      )
      .unique();

    if (!membership) return null;

    const [members, documents] = await Promise.all([
      ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .collect(),
      ctx.db
        .query("documents")
        .withIndex("by_organization", (q) => q.eq("organizationId", org._id))
        .collect(),
    ]);

    return {
      ...org,
      role: membership.role,
      joinedAt: membership.joinedAt,
      memberCount: members.length,
      documentCount: documents.length,
    };
  },
});

export const updateMemberRole = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    newRole: v.string(),
  },
  handler: async (ctx, { organizationId, userId, newRole }) => {
    const { user, membership: actorMembership } = await requirePermission(
      ctx,
      organizationId,
      "members:manage"
    );

    const validRoles = ["owner", "admin", "member", "viewer"];
    if (!validRoles.includes(newRole)) {
      throw new Error("Invalid role");
    }

    // Find the target membership
    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .unique();

    if (!targetMembership) {
      throw new Error("Member not found in this organization");
    }

    // Cannot change your own role through this endpoint
    if (userId === user._id) {
      throw new Error(
        "You cannot change your own role. Ask another owner or admin."
      );
    }

    const roleHierarchy: Record<string, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1,
    };

    const actorLevel = roleHierarchy[actorMembership.role] ?? 0;
    const targetCurrentLevel = roleHierarchy[targetMembership.role] ?? 0;
    const targetNewLevel = roleHierarchy[newRole] ?? 0;

    // Admins cannot modify owners or other admins of equal level
    if (actorLevel <= targetCurrentLevel && actorMembership.role !== "owner") {
      throw new Error(
        "You cannot change the role of someone with an equal or higher role"
      );
    }

    // Cannot grant a role higher than your own unless you are owner
    if (targetNewLevel > actorLevel && actorMembership.role !== "owner") {
      throw new Error(
        "You cannot promote someone to a role higher than your own"
      );
    }

    // If demoting from owner, ensure at least one owner remains
    if (targetMembership.role === "owner" && newRole !== "owner") {
      const allOwners = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (allOwners.length <= 1) {
        throw new Error(
          "Cannot demote the last owner. Transfer ownership first."
        );
      }
    }

    await ctx.db.patch(targetMembership._id, { role: newRole });
    return { success: true };
  },
});

export const removeMember = mutation({
  args: {
    organizationId: v.id("organizations"),
    userId: v.id("users"),
  },
  handler: async (ctx, { organizationId, userId }) => {
    const { user, membership: actorMembership } =
      await requireOrganizationAccess(ctx, organizationId);

    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .unique();

    if (!targetMembership) {
      throw new Error("Member not found in this organization");
    }

    const isSelf = userId === user._id;

    const roleHierarchy: Record<string, number> = {
      owner: 4,
      admin: 3,
      member: 2,
      viewer: 1,
    };

    const actorLevel = roleHierarchy[actorMembership.role] ?? 0;
    const targetLevel = roleHierarchy[targetMembership.role] ?? 0;

    if (!isSelf) {
      // Must be admin or above to remove others
      if (actorLevel < roleHierarchy["admin"]) {
        throw new Error("You don't have permission to remove members");
      }
      // Cannot remove someone of equal or higher rank unless you are owner
      if (actorLevel <= targetLevel && actorMembership.role !== "owner") {
        throw new Error(
          "You cannot remove someone with an equal or higher role"
        );
      }
    }

    // Never allow removing the last owner
    if (targetMembership.role === "owner") {
      const allOwners = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (allOwners.length <= 1) {
        throw new Error(
          "Cannot remove the last owner. Transfer ownership to someone else first."
        );
      }
    }

    await ctx.db.delete(targetMembership._id);

    const orgDocuments = await ctx.db
      .query("documents")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .collect();

    const presenceRecords = await Promise.all(
      orgDocuments.map((doc) =>
        ctx.db
          .query("presence")
          .withIndex("by_document_and_user", (q) =>
            q.eq("documentId", doc._id).eq("userId", userId)
          )
          .unique()
      )
    );

    await Promise.all(
      presenceRecords
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map((p) => ctx.db.delete(p._id))
    );

    return { success: true, selfRemoval: isSelf };
  },
});

export const transferOwnership = mutation({
  args: {
    organizationId: v.id("organizations"),
    newOwnerId: v.id("users"),
  },
  handler: async (ctx, { organizationId, newOwnerId }) => {
    const { user, membership: actorMembership } =
      await requireOrganizationAccess(ctx, organizationId);

    // Only the current owner can transfer ownership
    if (actorMembership.role !== "owner") {
      throw new Error("Only an owner can transfer ownership");
    }

    if (newOwnerId === user._id) {
      throw new Error("You are already an owner");
    }

    const targetMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", newOwnerId)
      )
      .unique();

    if (!targetMembership) {
      throw new Error("The target user is not a member of this organization");
    }

    // Promote the target to owner
    await ctx.db.patch(targetMembership._id, { role: "owner" });

    // Demote the current actor to admin
    await ctx.db.patch(actorMembership._id, { role: "admin" });

    return { success: true };
  },
});

export const leaveOrganization = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { organizationId }) => {
    const { user, membership } = await requireOrganizationAccess(
      ctx,
      organizationId
    );

    // Last owner cannot leave
    if (membership.role === "owner") {
      const allOwners = await ctx.db
        .query("organizationMembers")
        .withIndex("by_organization", (q) =>
          q.eq("organizationId", organizationId)
        )
        .filter((q) => q.eq(q.field("role"), "owner"))
        .collect();

      if (allOwners.length <= 1) {
        throw new Error(
          "You are the last owner. Transfer ownership before leaving."
        );
      }
    }

    await ctx.db.delete(membership._id);
    return { success: true };
  },
});

export const getMyMembership = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    const { user, membership } = await requireOrganizationAccess(
      ctx,
      organizationId
    );
    return { userId: user._id, role: membership.role };
  },
});