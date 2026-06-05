import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, teams, teamMembers, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";

const createTeamSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
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
          eq(teamMembers as any, id),
          eq(teamMembers.user_id, context.userId)
        ),
      });

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const orgTeams = await db.query.teams.findMany({
        where: eq(teams.organization_id, id),
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

      return NextResponse.json({ teams: orgTeams });
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
      const parsed = createTeamSchema.safeParse(body);

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

      const [team] = await db
        .insert(teams)
        .values({
          organization_id: id,
          name: parsed.data.name,
          description: parsed.data.description,
        })
        .returning();

      if (!team) {
        return NextResponse.json({ error: "Failed to create team" }, { status: 500 });
      }

      await db.insert(teamMembers).values({
        team_id: team.id,
        user_id: context.userId,
        role: "MANAGER",
      });

      return NextResponse.json({ team }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
