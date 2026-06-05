import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, prospects } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { ProspectStatus, PROSPECT_TRANSITIONS } from "@kage/shared";

const updateProspectSchema = z.object({
  companyName: z.string().min(1).max(255).optional(),
  companyDomain: z.string().max(255).optional(),
  companyLinkedinUrl: z.string().url().optional(),
  personName: z.string().min(1).max(255).optional(),
  personTitle: z.string().max(255).optional(),
  personLinkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  industry: z.string().max(255).optional(),
  companySize: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  status: z.nativeEnum(ProspectStatus).optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const [prospect] = await db
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.id, id),
            eq(prospects.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!prospect) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ prospect });
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
      const parsed = updateProspectSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const db = getDb();

      const [existing] = await db
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.id, id),
            eq(prospects.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (parsed.data.status && parsed.data.status !== existing.status) {
        const currentStatus = existing.status as ProspectStatus;
        const allowedTransitions = PROSPECT_TRANSITIONS[currentStatus];
        if (!allowedTransitions.includes(parsed.data.status)) {
          return NextResponse.json(
            { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
            { status: 400 }
          );
        }
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.companyName !== undefined) updateData["company_name"] = parsed.data.companyName;
      if (parsed.data.companyDomain !== undefined) updateData["company_domain"] = parsed.data.companyDomain;
      if (parsed.data.companyLinkedinUrl !== undefined) updateData["company_linkedin_url"] = parsed.data.companyLinkedinUrl;
      if (parsed.data.personName !== undefined) updateData["person_name"] = parsed.data.personName;
      if (parsed.data.personTitle !== undefined) updateData["person_title"] = parsed.data.personTitle;
      if (parsed.data.personLinkedinUrl !== undefined) updateData["person_linkedin_url"] = parsed.data.personLinkedinUrl;
      if (parsed.data.email !== undefined) updateData["email"] = parsed.data.email;
      if (parsed.data.industry !== undefined) updateData["industry"] = parsed.data.industry;
      if (parsed.data.companySize !== undefined) updateData["company_size"] = parsed.data.companySize;
      if (parsed.data.location !== undefined) updateData["location"] = parsed.data.location;
      if (parsed.data.status !== undefined) updateData["status"] = parsed.data.status;
      if (parsed.data.notes !== undefined) updateData["notes"] = parsed.data.notes;
      updateData["updated_at"] = new Date();

      const [updated] = await db
        .update(prospects)
        .set(updateData as any)
        .where(
          and(
            eq(prospects.id, id),
            eq(prospects.organization_id, context.organizationId)
          )
        )
        .returning();

      return NextResponse.json({ prospect: updated });
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

      const [existing] = await db
        .select()
        .from(prospects)
        .where(
          and(
            eq(prospects.id, id),
            eq(prospects.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await db
        .update(prospects)
        .set({ deleted_at: new Date() } as any)
        .where(
          and(
            eq(prospects.id, id),
            eq(prospects.organization_id, context.organizationId)
          )
        );

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
