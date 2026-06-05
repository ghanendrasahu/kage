import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { UserRole } from "@kage/shared";

const updateMemberSchema = z.object({
  role: z.nativeEnum(UserRole),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id, memberId } = await params;
      const body = await request.json();
      const parsed = updateMemberSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const { role } = parsed.data;
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

      const targetMembership = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, memberId),
      });

      if (!targetMembership) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      if (targetMembership.role === "OWNER") {
        return NextResponse.json(
          { error: "Cannot change owner role" },
          { status: 403 }
        );
      }

      if (!canAssignRole(requesterMembership.role as UserRole, role)) {
        return NextResponse.json(
          { error: "Cannot assign this role" },
          { status: 403 }
        );
      }

      const [updated] = await db
        .update(organizationMembers)
        .set({ role, updated_at: new Date() })
        .where(eq(organizationMembers.id, memberId))
        .returning();

      return NextResponse.json({ member: updated });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id, memberId } = await params;
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

      const targetMembership = await db.query.organizationMembers.findFirst({
        where: eq(organizationMembers.id, memberId),
      });

      if (!targetMembership) {
        return NextResponse.json({ error: "Member not found" }, { status: 404 });
      }

      if (targetMembership.user_id === context.userId) {
        return NextResponse.json(
          { error: "Cannot remove yourself" },
          { status: 400 }
        );
      }

      if (targetMembership.role === "OWNER") {
        return NextResponse.json(
          { error: "Cannot remove owner" },
          { status: 403 }
        );
      }

      await db
        .delete(organizationMembers)
        .where(eq(organizationMembers.id, memberId));

      return NextResponse.json({ success: true });
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
