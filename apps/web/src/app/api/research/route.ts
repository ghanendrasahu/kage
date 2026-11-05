import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError, recordAudit } from "@/lib/api";
import { getDb, researchReports, prospects } from "@kage/db";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { AuditAction } from "@kage/shared";
import { runResearchJob } from "@kage/workers/processors/research";

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
    const status = searchParams.get("status");

    const db = getDb();
    const conditions = [eq(researchReports.organization_id, context.organizationId)];

    if (prospectId) {
      conditions.push(eq(researchReports.prospect_id, prospectId));
    }

    if (status) {
      conditions.push(eq(researchReports.status, status));
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

    // Hydrate the account behind each report so the table can show a name
    // without an N+1 query per row.
    const prospectIds = [
      ...new Set(items.map((item) => item.prospect_id).filter(Boolean)),
    ] as string[];

    const prospectRows = prospectIds.length
      ? await db
          .select({
            id: prospects.id,
            company_name: prospects.company_name,
            person_name: prospects.person_name,
          })
          .from(prospects)
          .where(inArray(prospects.id, prospectIds))
      : [];

    const prospectById = new Map(prospectRows.map((row) => [row.id, row]));

    const reports = items.map((item) => {
      const prospect = item.prospect_id ? prospectById.get(item.prospect_id) : undefined;
      return {
        ...item,
        company_name: prospect?.company_name ?? "Unknown company",
        person_name: prospect?.person_name ?? null,
      };
    });

    return NextResponse.json({
      reports,
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

    if (report) {
      await recordAudit(context, AuditAction.CREATE, "RESEARCH_REPORT", report.id, {
        company_name: parsed.data.companyName,
        prospect_id: parsed.data.prospectId,
      });

      // No paid worker on the free tier: run after the response is sent.
      after(async () => {
        try {
          const result = await runResearchJob({
            organizationId: context.organizationId,
            userId: context.userId,
            prospectId: parsed.data.prospectId,
            reportId: report.id,
            companyName: parsed.data.companyName,
            companyDomain: parsed.data.companyDomain,
          });
          if (!result.success) {
            console.error("Research job failed:", result.error);
          }
        } catch (error) {
          console.error("Research job failed:", error);
        }
      });
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
