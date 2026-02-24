import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export type DocPermission = "view" | "comment" | "edit";

const permissionLevel: Record<DocPermission, number> = {
  view: 1,
  comment: 2,
  edit: 3,
};

export function hasPermission(
  permissions: string[],
  required: DocPermission
): boolean {
  // Check if any permission in the array meets or exceeds the required level
  return permissions.some(
    (p) => (permissionLevel[p as DocPermission] ?? 0) >= permissionLevel[required]
  );
}

// Map an org membership role to its document permission set
export function roleToPermissions(role: string): string[] {
  switch (role) {
    case "owner":
    case "admin":
      return ["view", "comment", "edit"];
    case "member":
      return ["view", "comment", "edit"];
    case "viewer":
      return ["view"];
    default:
      return ["view"];
  }
}

export async function resolveDocumentAccess(
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
  userId: Id<"users">
): Promise<{
  permissions: string[];
  source: "membership" | "share";
} | null> {
  const document = await ctx.db.get(documentId);
  if (!document) return null;

  // Org membership takes priority
  const membership = await ctx.db
    .query("organizationMembers")
    .withIndex("by_org_and_user", (q) =>
      q.eq("organizationId", document.organizationId).eq("userId", userId)
    )
    .unique();

  if (membership) {
    return {
      permissions: roleToPermissions(membership.role),
      source: "membership",
    };
  }

  // Fall through to explicit share
  const share = await ctx.db
    .query("documentShares")
    .withIndex("by_document_and_user", (q) =>
      q.eq("documentId", documentId).eq("sharedWithUserId", userId)
    )
    .unique();

  if (!share) return null;

  // Respect share expiry
  if (share.expiresAt !== undefined && share.expiresAt < Date.now()) {
    return null;
  }

  return {
    permissions: share.permissions,
    source: "share",
  };
}

export async function requireDocumentAccess(
  ctx: QueryCtx | MutationCtx,
  documentId: Id<"documents">,
  userId: Id<"users">,
  required: DocPermission = "view"
): Promise<{ permissions: string[]; source: "membership" | "share" }> {
  const access = await resolveDocumentAccess(ctx, documentId, userId);

  if (!access) {
    throw new Error("Document not found or access denied");
  }

  if (!hasPermission(access.permissions, required)) {
    throw new Error(
      `This action requires ${required} permission on this document`
    );
  }

  return access;
}