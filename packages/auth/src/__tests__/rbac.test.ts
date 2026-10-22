import { describe, expect, it } from "vitest";

import { UserRole } from "@kage/shared";

import {
  canAccessResource,
  hasAllPermissions,
  hasAnyPermission,
  hasMinRole,
  hasPermission,
} from "../rbac";

describe("hasPermission", () => {
  it("reserves organization management for the owner", () => {
    expect(hasPermission(UserRole.OWNER, "organization:manage")).toBe(true);
    expect(hasPermission(UserRole.ADMIN, "organization:manage")).toBe(false);
    expect(hasPermission(UserRole.MANAGER, "organization:manage")).toBe(false);
  });

  it("reserves billing for the owner only", () => {
    expect(hasPermission(UserRole.OWNER, "billing:manage")).toBe(true);
    for (const role of [UserRole.ADMIN, UserRole.MANAGER, UserRole.SALES_REP, UserRole.VIEWER]) {
      expect(hasPermission(role, "billing:manage")).toBe(false);
    }
  });

  it("never grants a viewer any :all scope", () => {
    for (const permission of [
      "prospect:all",
      "research:all",
      "outreach:all",
      "campaign:all",
    ] as const) {
      expect(hasPermission(UserRole.VIEWER, permission)).toBe(false);
    }
  });

  it("gives a sales rep own-scope but not read-scope", () => {
    expect(hasPermission(UserRole.SALES_REP, "prospect:own")).toBe(true);
    expect(hasPermission(UserRole.SALES_REP, "prospect:read")).toBe(false);
  });

  it("returns false for an unknown role", () => {
    expect(hasPermission("ghost" as UserRole, "prospect:read")).toBe(false);
  });
});

describe("hasAnyPermission / hasAllPermissions", () => {
  it("any matches a single granted permission", () => {
    expect(hasAnyPermission(UserRole.VIEWER, ["prospect:all", "prospect:read"])).toBe(true);
  });

  it("any rejects when nothing matches", () => {
    expect(hasAnyPermission(UserRole.VIEWER, ["prospect:all", "billing:manage"])).toBe(false);
  });

  it("all requires every permission", () => {
    expect(hasAllPermissions(UserRole.OWNER, ["organization:manage", "billing:manage"])).toBe(
      true
    );
    expect(hasAllPermissions(UserRole.ADMIN, ["organization:manage", "team:manage"])).toBe(
      false
    );
  });
});

describe("hasMinRole", () => {
  it("follows the role hierarchy", () => {
    expect(hasMinRole(UserRole.OWNER, UserRole.ADMIN)).toBe(true);
    expect(hasMinRole(UserRole.ADMIN, UserRole.MANAGER)).toBe(true);
    expect(hasMinRole(UserRole.MANAGER, UserRole.SALES_REP)).toBe(true);
    expect(hasMinRole(UserRole.SALES_REP, UserRole.VIEWER)).toBe(true);
  });

  it("does not let a lower role clear a higher bar", () => {
    expect(hasMinRole(UserRole.VIEWER, UserRole.ADMIN)).toBe(false);
    expect(hasMinRole(UserRole.SALES_REP, UserRole.MANAGER)).toBe(false);
  });
});

describe("canAccessResource", () => {
  it("lets a manager reach every prospect", () => {
    expect(canAccessResource(UserRole.MANAGER, null, "user-1", "all")).toBe(true);
  });

  it("restricts a sales rep to their own records", () => {
    expect(canAccessResource(UserRole.SALES_REP, "user-1", "user-1", "own")).toBe(true);
    expect(canAccessResource(UserRole.SALES_REP, "user-2", "user-1", "own")).toBe(false);
  });

  it("checks the permission of the requested resource type", () => {
    // Regression: the check used to be hard-wired to prospects, so a sales
    // rep was denied read access to campaigns they are allowed to read.
    expect(canAccessResource(UserRole.SALES_REP, null, "user-1", "read", "campaign")).toBe(true);
    expect(canAccessResource(UserRole.SALES_REP, null, "user-1", "read", "research")).toBe(false);
  });

  it("keeps the prospect default for backwards compatibility", () => {
    expect(canAccessResource(UserRole.VIEWER, null, "user-1", "read")).toBe(true);
    expect(canAccessResource(UserRole.MANAGER, null, "user-1", "read")).toBe(false);
  });
});
