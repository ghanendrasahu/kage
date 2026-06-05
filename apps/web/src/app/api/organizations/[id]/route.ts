import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, organizations, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";

const updateOrganizationSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website: z.string().url().optional(),
  logo_url: z.string().url().optional(),
  settings: z.record(z.unknown()).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const org = await db.query.organizations.findFirst({
        where: and(
          eq(organizations.id, id),
          eq(organizations.deleted_at, null as any)
        ),
      });

      if (!org) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const membership = await db.query.organizationMembers.findFirst({
        where: and(
          eq(organizationMembers.organization_id, id),
          eq(organizationMembers.user_id, context.userId)
        ),
      });

      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      return NextResponse.json({ organization: org });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = updateOrganizationSchema.safeParse(body);

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

      if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const [updated] = await db
        .update(organizations)
        .set({ ...parsed.data, updated_at: new Date() })
        .where(eq(organizations.id, id))
        .returning();

      return NextResponse.json({ organization: updated });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
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

      if (!membership || membership.role !== "OWNER") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      await db
        .update(organizations)
        .set({ deleted_at: new Date() })
        .where(eq(organizations.id, id));

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
