import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  getCurrentUser,
  requireOrganizationAccess,
  requirePermission,
} from "./lib/auth";
import { generateInvitationToken } from "./lib/tokens";

export const create = mutation({
  args: {
    organizationId: v.id("organizations"),
    email: v.string(),
    role: v.string(),
  },
  handler: async (ctx, { organizationId, email, role }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    await requirePermission(ctx, organizationId, "invitations:create");

    const recentInvitations = await ctx.db
      .query("invitations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .filter((q) =>
        q.and(
          q.eq(q.field("invitedBy"), user._id),
          q.gt(q.field("_creationTime"), Date.now() - 3_600_000)
        )
      )
      .collect();

    if (recentInvitations.length >= 20) {
      throw new Error(
        "You've sent 20 invitations in the last hour. Please wait before sending more."
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (normalizedEmail.length > 254) {
      throw new Error("Invalid email address");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw new Error("Invalid email address");
    }

    const validRoles = ["admin", "member", "viewer"];
    if (!validRoles.includes(role)) throw new Error("Invalid role");

    const org = await ctx.db.get(organizationId);
    if (!org) throw new Error("Organization not found");

    // Check if this person is already a member
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
      .unique();

    if (existingUser) {
      const existingMembership = await ctx.db
        .query("organizationMembers")
        .withIndex("by_org_and_user", (q) =>
          q.eq("organizationId", organizationId).eq("userId", existingUser._id)
        )
        .unique();

      if (existingMembership) {
        throw new Error("This person is already a member of the organization");
      }
    }

    // Check for an existing pending invitation to this address
    const existingInvitation = await ctx.db
      .query("invitations")
      .withIndex("by_org_and_email", (q) =>
        q.eq("organizationId", organizationId).eq("email", normalizedEmail)
      )
      .filter((q) => q.eq(q.field("status"), "pending"))
      .first();

    if (existingInvitation) {
      throw new Error(
        "An invitation has already been sent to this email address"
      );
    }

    const token = generateInvitationToken();
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    await ctx.db.insert("invitations", {
      organizationId,
      email: normalizedEmail,
      role,
      token,
      invitedBy: user._id,
      status: "pending",
      expiresAt,
    });

    // Schedule the email. Because this is inside a mutation, the email
    // will only be sent if the entire mutation succeeds.
    await ctx.scheduler.runAfter(
      0,
      internal.actions.email.sendInvitationEmail,
      {
        organizationName: org.name,
        inviterName: user.name,
        recipientEmail: normalizedEmail,
        role,
        token,
      }
    );

    return { success: true };
  },
});

export const list = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    await requireOrganizationAccess(ctx, organizationId);

    const invitations = await ctx.db
      .query("invitations")
      .withIndex("by_organization", (q) =>
        q.eq("organizationId", organizationId)
      )
      .collect();

    return Promise.all(
      invitations.map(async (invitation) => {
        const inviter = await ctx.db.get(invitation.invitedBy);
        return {
          ...invitation,
          inviterName: inviter?.name ?? "Unknown",
        };
      })
    );
  },
});

export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (token.length !== 64) {
      return null;
    }

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) return null;

    const org = await ctx.db.get(invitation.organizationId);
    const inviter = await ctx.db.get(invitation.invitedBy);

    // Mark expired ones as expired in the returned data
    // (we do not patch here — that happens on accept attempt)
    const isExpired = invitation.expiresAt < Date.now();

    return {
      ...invitation,
      status:
        isExpired && invitation.status === "pending"
          ? "expired"
          : invitation.status,
      organizationName: org?.name ?? "Unknown organization",
      organizationSlug: org?.slug ?? "",
      inviterName: inviter?.name ?? "Someone",
    };
  },
});

export const accept = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (token.length !== 64) {
      throw new Error("Invalid invitation token");
    }
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const invitation = await ctx.db
      .query("invitations")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();

    if (!invitation) throw new Error("Invitation not found");

    if (invitation.status === "revoked") {
      throw new Error("This invitation has been revoked");
    }

    if (invitation.status === "accepted") {
      throw new Error("This invitation has already been accepted");
    }

    if (invitation.expiresAt < Date.now() || invitation.status === "expired") {
      await ctx.db.patch(invitation._id, { status: "expired" });
      throw new Error("This invitation has expired");
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new Error(
        "This invitation was sent to a different email address. Please sign in with the correct account."
      );
    }

    // Check if already a member (edge case: invited twice via different flows)
    const existingMembership = await ctx.db
      .query("organizationMembers")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", invitation.organizationId).eq("userId", user._id)
      )
      .unique();

    if (existingMembership) {
      await ctx.db.patch(invitation._id, {
        status: "accepted",
        acceptedAt: Date.now(),
        acceptedBy: user._id,
      });
      const org = await ctx.db.get(invitation.organizationId);
      return { success: true, organizationSlug: org?.slug ?? "" };
    }

    // Add to org
    await ctx.db.insert("organizationMembers", {
      organizationId: invitation.organizationId,
      userId: user._id,
      role: invitation.role,
      joinedAt: Date.now(),
    });

    await ctx.db.patch(invitation._id, {
      status: "accepted",
      acceptedAt: Date.now(),
      acceptedBy: user._id,
    });

    const org = await ctx.db.get(invitation.organizationId);
    return { success: true, organizationSlug: org?.slug ?? "" };
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, { invitationId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) throw new Error("Not authenticated");

    const invitation = await ctx.db.get(invitationId);
    if (!invitation) throw new Error("Invitation not found");

    const { membership } = await requireOrganizationAccess(
      ctx,
      invitation.organizationId
    );

    const isOwnerOrAdmin = ["owner", "admin"].includes(membership.role);
    const isInviter = invitation.invitedBy === user._id;

    if (!isOwnerOrAdmin && !isInviter) {
      throw new Error("You don't have permission to revoke this invitation");
    }

    if (invitation.status !== "pending") {
      throw new Error("Only pending invitations can be revoked");
    }

    await ctx.db.patch(invitationId, { status: "revoked" });
    return { success: true };
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const expired = await ctx.db
      .query("invitations")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lt(q.field("expiresAt"), now)
        )
      )
      .collect();

    await Promise.all(
      expired.map((inv) => ctx.db.patch(inv._id, { status: "expired" }))
    );

    return { updated: expired.length };
  },
});