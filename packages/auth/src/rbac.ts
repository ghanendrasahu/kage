import { ROLE_HIERARCHY, ROLE_PERMISSIONS, type UserRole } from "@kage/shared";

export type Permission =
  | "organization:manage"
  | "team:manage"
  | "user:manage"
  | "prospect:all"
  | "prospect:own"
  | "prospect:read"
  | "research:all"
  | "research:own"
  | "research:read"
  | "outreach:all"
  | "outreach:own"
  | "outreach:read"
  | "campaign:all"
  | "campaign:read"
  | "integration:manage"
  | "billing:manage"
  | "audit:read"
  | "settings:manage"
  | "settings:read";

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return (permissions as readonly string[]).includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasMinRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? 0;
  return userLevel >= requiredLevel;
}

export type ResourceType = "prospect" | "research" | "outreach" | "campaign";

export function canAccessResource(
  userRole: UserRole,
  resourceOwnerId: string | null,
  userId: string,
  permission: "all" | "own" | "read",
  resourceType: ResourceType = "prospect"
): boolean {
  if (permission === "read") {
    return hasPermission(userRole, `${resourceType}:read` as Permission);
  }

  if (permission === "all") {
    return hasPermission(userRole, `${resourceType}:all` as Permission);
  }

  if (permission === "own") {
    return resourceOwnerId === userId;
  }

  return false;
}
