import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, researchReports, researchSources, researchFindings, prospects } from "@kage/db";
import { eq, and, desc, sql } from "drizzle-orm";

const startResearchSchema = z.object({
  prospectId: z.string().uuid(),
  companyName: z.string().min(1).max(255),
  companyDomain: z.string().max(255).optional(),
  targetPersona: z.string().max(255).optional(),
  productService: z.string().max(500).optional(),
  icpDescription: z.string().optional(),
});

export const GET = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const prospectId = searchParams.get("prospectId");

    const db = getDb();
    const conditions = [eq(researchReports.organization_id, context.organizationId)];

    if (prospectId) {
      conditions.push(eq(researchReports.prospect_id, prospectId));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(researchReports)
        .where(and(...conditions))
        .orderBy(desc(researchReports.created_at))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(researchReports)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      reports: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, context) => {
  try {
    const body = await request.json();
    const parsed = startResearchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [existingProspect] = await db
      .select()
      .from(prospects)
      .where(
        and(
          eq(prospects.id, parsed.data.prospectId),
          eq(prospects.organization_id, context.organizationId)
        )
      )
      .limit(1);

    if (!existingProspect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    const [report] = await db
      .insert(researchReports)
      .values({
        organization_id: context.organizationId,
        prospect_id: parsed.data.prospectId,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
