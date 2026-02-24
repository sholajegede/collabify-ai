export const RESOURCES = [
  "documents",
  "members",
  "invitations",
  "settings",
  "billing",
] as const;

export const ACTIONS = ["read", "create", "edit", "delete", "manage"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];
export type Permission = `${Resource}:${Action}` | `${Resource}:*` | "*";

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ["*"],
  admin: ["documents:*", "members:*", "invitations:*", "settings:manage"],
  member: [
    "documents:read",
    "documents:create",
    "documents:edit",
    "members:read",
    "invitations:create",
  ],
  viewer: ["documents:read", "members:read"],
};

export function getRolePermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: string, required: Permission): boolean {
  const permissions = getRolePermissions(role);
  if (permissions.includes(required)) return true;
  if (permissions.includes("*")) return true;
  const [resource] = required.split(":") as [Resource, Action];
  if (permissions.includes(`${resource}:*` as Permission)) return true;
  return false;
}