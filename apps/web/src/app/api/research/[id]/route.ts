import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, researchReports, researchSources, researchFindings } from "@kage/db";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const [report] = await db
        .select()
        .from(researchReports)
        .where(
          and(
            eq(researchReports.id, id),
            eq(researchReports.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!report) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const [sources, findings] = await Promise.all([
        db
          .select()
          .from(researchSources)
          .where(eq(researchSources.report_id, id)),
        db
          .select()
          .from(researchFindings)
          .where(eq(researchFindings.report_id, id)),
      ]);

      return NextResponse.json({
        report: {
          ...report,
          sources,
          findings,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
