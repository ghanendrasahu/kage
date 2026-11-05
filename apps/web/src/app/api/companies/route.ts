import { NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, prospects } from "@kage/db";
import { eq, sql, desc } from "drizzle-orm";

/**
 * Accounts grouped from the prospect list. Grouping is done in SQL so the page
 * stays correct past the 100-row pagination cap of /api/prospects.
 */
export const GET = withAuth(async (_request, context) => {
  try {
    const db = getDb();

    const companies = await db
      .select({
        company_name: prospects.company_name,
        company_domain: sql<string | null>`max(${prospects.company_domain})`,
        industry: sql<string | null>`max(${prospects.industry})`,
        company_size: sql<string | null>`max(${prospects.company_size})`,
        contacts: sql<number>`count(*)::int`,
        researched: sql<number>`count(*) filter (where ${prospects.status} in ('RESEARCHED', 'DRAFTING', 'REVIEWING', 'APPROVED', 'SENT', 'REPLIED'))::int`,
        in_pipeline: sql<number>`count(*) filter (where ${prospects.status} in ('RESEARCHING', 'RESEARCHED', 'DRAFTING', 'REVIEWING'))::int`,
        last_added: sql<string>`max(${prospects.created_at})`,
      })
      .from(prospects)
      .where(eq(prospects.organization_id, context.organizationId))
      .groupBy(prospects.company_name)
      .orderBy(desc(sql`max(${prospects.created_at})`));

    return NextResponse.json({ companies });
  } catch (error) {
    return handleApiError(error);
  }
});
