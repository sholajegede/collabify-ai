import { QueryCtx, MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { Permission, hasPermission } from "./permissions";

export async function getOrCreateUser(
  ctx: MutationCtx,
  kindeUser: {
    subject: string;
    email?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }
) {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_kindeId", (q) => q.eq("kindeId", kindeUser.subject))
    .unique();

  if (existing) return existing;

  const userId = await ctx.db.insert("users", {
    kindeId: kindeUser.subject,
    email: kindeUser.email ?? "",
    name:
      `${kindeUser.given_name ?? ""} ${kindeUser.family_name ?? ""}`.trim() ||
      "User",
    givenName: kindeUser.given_name,
    familyName: kindeUser.family_name,
    picture: kindeUser.picture,
  });

  return await ctx.db.get(userId);
}

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;  // ← was: throw new Error("Not authenticated")

  const user = await ctx.db
    .query("users")
    .withIndex("by_kindeId", (q) => q.eq("kindeId", identity.subject))
    .unique();

  return user ?? null;  // ← was: throw new Error("User not synced...")
}

export async function requireOrganizationAccess(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">
) {
  const user = await getCurrentUser(ctx);
  if (!user) throw new Error("Not authenticated");

  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_and_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", user._id)
    )
    .unique();

  if (!membership) throw new Error("Access denied");

  return { user, membership };
}

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  permission: Permission
) {
  const { user, membership } = await requireOrganizationAccess(ctx, organizationId);

  if (!hasPermission(membership.role, permission)) {
    throw new Error(`Access denied: missing permission '${permission}'`);
  }

  return { user, membership };
}

export async function checkPermission(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  permission: Permission
): Promise<boolean> {
  try {
    const { membership } = await requireOrganizationAccess(ctx, organizationId);
    return hasPermission(membership.role, permission);
  } catch {
    return false;
  }
}

export async function hasRoleLevel(
  ctx: QueryCtx | MutationCtx,
  organizationId: Id<"organizations">,
  minimumRole: "owner" | "admin" | "member" | "viewer"
): Promise<boolean> {
  const roleHierarchy = { owner: 4, admin: 3, member: 2, viewer: 1 };
  try {
    const { membership } = await requireOrganizationAccess(ctx, organizationId);
    const userLevel = roleHierarchy[membership.role as keyof typeof roleHierarchy] ?? 0;
    return userLevel >= roleHierarchy[minimumRole];
  } catch {
    return false;
  }
}

export async function logAccess(
  ctx: MutationCtx,
  params: {
    userId: Id<"users">;
    resourceType: string;
    resourceId: string;
    action: string;
    organizationId?: Id<"organizations">;
    metadata?: { sharedAccess?: boolean };
  }
) {
  await ctx.db.insert("accessLogs", {
    ...params,
    timestamp: Date.now(),
  });
}