import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, organizationMembers, users } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { UserRole } from "@kage/shared";

const inviteMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(UserRole),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, context.userId)
        ),
      });

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const members = await db.query.organizationMembers.findMany({
        where: eq(organizationMembers.organization_id, id),
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
        },
      });

      return NextResponse.json({ members });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = inviteMemberSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { email, role } = parsed.data;
      const db = getDb();

      const requesterMembership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, context.userId)
        ),
      });

      if (
        !requesterMembership ||
        !["OWNER", "ADMIN"].includes(requesterMembership.role)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!canAssignRole(requesterMembership.role as UserRole, role)) {
        return NextResponse.json(
          { error: "Cannot assign this role" },
          { status: 403 }
        );
      }

      const targetUser = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found. They must sign up first." },
          { status: 404 }
        );
      }

      const existingMembership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, targetUser.id)
        ),
      });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 409 }
        );
      }

      const [newMember] = await db
        .insert(organizationMembers)
        .values({
          organization_id: id,
          user_id: targetUser.id,
          role,
          invited_at: new Date(),
        })
        .returning();

      return NextResponse.json({ member: newMember }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

function canAssignRole(requesterRole: UserRole, targetRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    [UserRole.OWNER]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.MANAGER]: 3,
    [UserRole.SALES_REP]: 2,
    [UserRole.VIEWER]: 1,
  };

  return hierarchy[requesterRole] > hierarchy[targetRole];
}
