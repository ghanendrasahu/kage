import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, teamMembers, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { UserRole } from "@kage/shared";

const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.nativeEnum(UserRole).default(UserRole.SALES_REP),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { teamId } = await params;
      const db = getDb();

      const members = await db.query.teamMembers.findMany({
        where: eq(teamMembers.team_id, teamId),
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
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id, teamId } = await params;
      const body = await request.json();
      const parsed = addTeamMemberSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { userId, role } = parsed.data;
      const db = getDb();

      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, context.userId)
        ),
      });

      if (
        !membership ||
        !["OWNER", "ADMIN", "MANAGER"].includes(membership.role)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const targetOrgMembership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, userId)
        ),
      });

      if (!targetOrgMembership) {
        return NextResponse.json(
          { error: "User is not a member of this organization" },
          { status: 400 }
        );
      }

      const existingTeamMembership = await db.query.teamMembers.findFirst({
        where: and(
          eq(teamMembers.team_id, teamId),
          eq(teamMembers.user_id, userId)
        ),
      });

      if (existingTeamMembership) {
        return NextResponse.json(
          { error: "User is already a member of this team" },
          { status: 409 }
        );
      }

      const [newMember] = await db
        .insert(teamMembers)
        .values({
          team_id: teamId,
          user_id: userId,
          role,
        })
        .returning();

      return NextResponse.json({ member: newMember }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { teamId } = await params;
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get("userId");

      if (!userId) {
        return NextResponse.json(
          { error: "userId query parameter required" },
          { status: 400 }
        );
      }

      const db = getDb();

      await db
        .delete(teamMembers)
        .where(
          and(
            eq(teamMembers.team_id, teamId),
            eq(teamMembers.user_id, userId)
          )
        );

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
