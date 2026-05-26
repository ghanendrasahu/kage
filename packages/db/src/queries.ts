import { eq, and } from "drizzle-orm";
import {
  users,
  organizations,
  organizationMembers,
  prospects,
  researchReports,
  outreachPackages,
  outreachMessages,
  campaigns,
  teams,
  teamMembers,
  auditLogs,
} from "./schema";
import { getDb } from "./client";
import type { UserRole } from "@kage/shared";

function getDbSafe() {
  return getDb();
}

export async function getUserByEmail(email: string) {
  const db = getDbSafe();
  return db.query.users.findFirst({ where: eq(users.email, email) });
}

export async function getUserById(id: string) {
  const db = getDbSafe();
  return db.query.users.findFirst({ where: eq(users.id, id) });
}

export async function getOrgMembers(organizationId: string) {
  const db = getDbSafe();
  return db.query.organizationMembers.findMany({
    where: eq(organizationMembers.organization_id, organizationId),
    with: {
      user: {
        columns: { id: true, name: true, email: true, avatar_url: true },
      },
    },
  });
}

export async function isOrgMember(organizationId: string, userId: string) {
  const db = getDbSafe();
  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organization_id, organizationId),
      eq(organizationMembers.user_id, userId)
    ),
  });
  return !!member;
}

export async function getUserOrgRole(organizationId: string, userId: string): Promise<UserRole | null> {
  const db = getDbSafe();
  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organization_id, organizationId),
      eq(organizationMembers.user_id, userId)
    ),
  });
  return (member?.role as UserRole) ?? null;
}

export async function createOrgWithMember(orgName: string, slug: string, userId: string, role: UserRole) {
  const db = getDbSafe();
  const [org] = await db
    .insert(organizations)
    .values({ name: orgName, slug })
    .returning();

  if (org) {
    await db.insert(organizationMembers).values({
      organization_id: org.id,
      user_id: userId,
      role,
      joined_at: new Date(),
    });
  }

  return org;
}

export async function getOrgProspects(orgId: string, page = 1, limit = 20) {
  const db = getDbSafe();
  const offset = (page - 1) * limit;

  const items = await db.query.prospects.findMany({
    where: eq(prospects.organization_id, orgId),
    orderBy: (fields, { desc }) => [desc(fields.created_at)],
    limit,
    offset,
  });

  return items;
}

export async function getOrgTeams(orgId: string) {
  const db = getDbSafe();
  return db.query.teams.findMany({
    where: eq(teams.organization_id, orgId),
    with: {
      members: {
        with: {
          user: {
            columns: { id: true, name: true, email: true, avatar_url: true },
          },
        },
      },
    },
  });
}

export async function createAuditLog(
  organizationId: string,
  userId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, unknown>
) {
  const db = getDbSafe();
  return db.insert(auditLogs).values({
    organization_id: organizationId,
    user_id: userId,
    action: action as any,
    resource_type: resourceType,
    resource_id: resourceId,
    details,
  });
}
