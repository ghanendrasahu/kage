import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, outreachPackages, outreachMessages, prospects, researchReports } from "@kage/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { OutreachChannel, MessageStatus } from "@kage/shared";

const generateOutreachSchema = z.object({
  prospectId: z.string().uuid(),
  researchReportId: z.string().uuid(),
  productService: z.string().min(1).max(500),
  icpDescription: z.string().optional(),
  salesContext: z.string().optional(),
});

export const GET = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const prospectId = searchParams.get("prospectId");

    const db = getDb();
    const conditions = [eq(outreachPackages.organization_id, context.organizationId)];

    if (prospectId) {
      conditions.push(eq(outreachPackages.prospect_id, prospectId));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(outreachPackages)
        .where(and(...conditions))
        .orderBy(desc(outreachPackages.created_at))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(outreachPackages)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      packages: items,
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
    const parsed = generateOutreachSchema.safeParse(body);

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

    const [existingReport] = await db
      .select()
      .from(researchReports)
      .where(
        and(
          eq(researchReports.id, parsed.data.researchReportId),
          eq(researchReports.organization_id, context.organizationId)
        )
      )
      .limit(1);

    if (!existingReport) {
      return NextResponse.json({ error: "Research report not found" }, { status: 404 });
    }

    const [outreachPackage] = await db
      .insert(outreachPackages)
      .values({
        organization_id: context.organizationId,
        prospect_id: parsed.data.prospectId,
        research_report_id: parsed.data.researchReportId,
        status: "PENDING",
      })
      .returning();

    return NextResponse.json({ outreachPackage }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
