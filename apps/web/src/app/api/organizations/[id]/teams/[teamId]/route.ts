import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, teams, teamMembers, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";

const updateTeamSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id, teamId } = await params;
      const db = getDb();

      const team = await db.query.teams.findFirst({
        where: and(
          eq(teams.id, teamId),
          eq(teams.organization_id, id)
        ),
        with: {
          members: {
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
          },
        },
      });

      if (!team) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ team });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id, teamId } = await params;
      const body = await request.json();
      const parsed = updateTeamSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

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

      const [updated] = await db
        .update(teams)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(
          and(eq(teams.id, teamId), eq(teams.organization_id, id))
        )
        .returning();

      return NextResponse.json({ team: updated });
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
      const { id, teamId } = await params;
      const db = getDb();

      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, context.userId)
        ),
      });

      if (
        !membership ||
        !["OWNER", "ADMIN"].includes(membership.role)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await db
        .delete(teams)
        .where(
          and(eq(teams.id, teamId), eq(teams.organization_id, id))
        );

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
