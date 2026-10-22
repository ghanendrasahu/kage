import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@kage/shared";

import { closeDb, getDb } from "../client";
import {
  createAuditLog,
  createOrgWithMember,
  getOrgMembers,
  getOrgProspects,
  getUserByEmail,
  getUserOrgRole,
  isOrgMember,
} from "../queries";
import { auditLogs, organizationMembers, prospects, users } from "../schema";

const PACKAGE_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const HAS_DATABASE = Boolean(process.env["DATABASE_URL"]);

/**
 * These are real integration tests: they run against the Postgres service
 * that CI provisions (and are skipped when no DATABASE_URL is present).
 */
describe.skipIf(!HAS_DATABASE)("db queries (postgres)", () => {
  const stamp = Date.now();
  const email = `integration-${stamp}@example.com`;
  let userId = "";
  let orgId = "";

  beforeAll(() => {
    // Apply the committed Drizzle migrations - never `db:push`.
    execSync("npx drizzle-kit migrate", {
      cwd: PACKAGE_DIR,
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: process.env["DATABASE_URL"] },
    });
  }, 120_000);

  afterAll(async () => {
    const db = getDb();
    if (orgId) {
      await db.delete(auditLogs).where(eq(auditLogs.organization_id, orgId));
      await db.delete(prospects).where(eq(prospects.organization_id, orgId));
      await db.delete(organizationMembers).where(eq(organizationMembers.organization_id, orgId));
    }
    if (userId) {
      await db.delete(users).where(eq(users.id, userId));
    }
    await closeDb();
  });

  it("looks a user up by email", async () => {
    const db = getDb();
    const [created] = await db
      .insert(users)
      .values({ email, name: "Integration User" })
      .returning();

    userId = created!.id;

    const found = await getUserByEmail(email);
    expect(found?.email).toBe(email);
    expect(await getUserByEmail("nobody@example.com")).toBeUndefined();
  });

  it("creates an organization together with its first member", async () => {
    const org = await createOrgWithMember(
      "Integration Org",
      `integration-org-${stamp}`,
      userId,
      UserRole.OWNER
    );

    expect(org?.id).toBeTruthy();
    orgId = org!.id;

    expect(await isOrgMember(orgId, userId)).toBe(true);
    expect(await getUserOrgRole(orgId, userId)).toBe(UserRole.OWNER);
    expect(await getUserOrgRole(orgId, "00000000-0000-0000-0000-000000000000")).toBeNull();
  });

  it("lists the members of an organization with their user details", async () => {
    const members = await getOrgMembers(orgId);

    expect(members).toHaveLength(1);
    expect(members[0]!.user.email).toBe(email);
    expect(members[0]!.role).toBe("OWNER");
  });

  it("paginates the prospects of an organization", async () => {
    const db = getDb();
    await db.insert(prospects).values([
      {
        organization_id: orgId,
        company_name: "Acme",
        person_name: "Ada",
        created_at: new Date("2024-01-01T00:00:00Z"),
      },
      {
        organization_id: orgId,
        company_name: "Globex",
        person_name: "Grace",
        created_at: new Date("2024-02-01T00:00:00Z"),
      },
      {
        organization_id: orgId,
        company_name: "Initech",
        person_name: "Alan",
        created_at: new Date("2024-03-01T00:00:00Z"),
      },
    ]);

    const firstPage = await getOrgProspects(orgId, 1, 2);
    const secondPage = await getOrgProspects(orgId, 2, 2);

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
    // newest first
    expect(firstPage[0]!.company_name).toBe("Initech");
  });

  it("writes an audit log entry", async () => {
    const db = getDb();
    await createAuditLog(
      orgId,
      userId,
      "organization.created",
      "organization",
      orgId,
      { source: "integration-test" }
    );

    const logs = await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.organization_id, orgId));

    expect(logs).toHaveLength(1);
    expect(logs[0]!.action).toBe("organization.created");
    expect(logs[0]!.resource_type).toBe("organization");
  });
});

describe.skipIf(HAS_DATABASE)("db queries (no database configured)", () => {
  it("needs DATABASE_URL to run the integration suite", () => {
    expect(HAS_DATABASE).toBe(false);
    expect(process.env["DATABASE_URL"]).toBeUndefined();
  });
});

