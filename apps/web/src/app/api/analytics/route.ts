import { NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, prospects, outreachMessages, campaigns, researchReports } from "@kage/db";
import { eq, and, gt, sql } from "drizzle-orm";
import { CampaignStatus } from "@kage/shared";

const SERIES_DAYS = 7;

function buildSeries(rows: Array<{ day: string | Date | null; count: number }>, days: Date[]) {
  const byDay = new Map<string, number>();
  for (const row of rows) {
    if (!row.day) continue;
    const key =
      row.day instanceof Date
        ? row.day.toISOString().slice(0, 10)
        : String(row.day).slice(0, 10);
    byDay.set(key, row.count);
  }
  return days.map((day) => byDay.get(day.toISOString().slice(0, 10)) ?? 0);
}

function lastDays(count: number): Date[] {
  const days: Date[] = [];
  const today = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCHours(0, 0, 0, 0);
    day.setUTCDate(day.getUTCDate() - offset);
    days.push(day);
  }
  return days;
}

export const GET = withAuth(async (request, context) => {
  try {
    const db = getDb();
    const orgId = context.organizationId;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - SERIES_DAYS * 24 * 60 * 60 * 1000);
    const days = lastDays(SERIES_DAYS);

    const [
      totalProspectsResult,
      prospectsByStatusResult,
      totalMessagesResult,
      messagesByStatusResult,
      totalCampaignsResult,
      activeCampaignsResult,
      totalResearchResult,
      recentMessagesResult,
      prospectSeriesResult,
      messageSeriesResult,
      campaignSeriesResult,
      researchSeriesResult,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(prospects)
        .where(eq(prospects.organization_id, orgId)),

      db
        .select({
          status: prospects.status,
          count: sql<number>`count(*)::int`,
        })
        .from(prospects)
        .where(eq(prospects.organization_id, orgId))
        .groupBy(prospects.status),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(outreachMessages)
        .where(eq(outreachMessages.organization_id, orgId)),

      db
        .select({
          status: outreachMessages.status,
          count: sql<number>`count(*)::int`,
        })
        .from(outreachMessages)
        .where(eq(outreachMessages.organization_id, orgId))
        .groupBy(outreachMessages.status),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(campaigns)
        .where(eq(campaigns.organization_id, orgId)),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(campaigns)
        .where(
          and(
            eq(campaigns.organization_id, orgId),
            eq(campaigns.status, CampaignStatus.ACTIVE)
          )
        ),

      db
        .select({ count: sql<number>`count(*)::int` })
        .from(researchReports)
        .where(eq(researchReports.organization_id, orgId)),

      db
        .select({
          status: outreachMessages.status,
          count: sql<number>`count(*)::int`,
        })
        .from(outreachMessages)
        .where(
          and(
            eq(outreachMessages.organization_id, orgId),
            gt(outreachMessages.created_at, thirtyDaysAgo)
          )
        )
        .groupBy(outreachMessages.status),

      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${prospects.created_at}), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(prospects)
        .where(
          and(eq(prospects.organization_id, orgId), gt(prospects.created_at, sevenDaysAgo))
        )
        .groupBy(sql`date_trunc('day', ${prospects.created_at})`),

      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${outreachMessages.created_at}), 'YYYY-MM-DD')`,
          status: outreachMessages.status,
          count: sql<number>`count(*)::int`,
        })
        .from(outreachMessages)
        .where(
          and(
            eq(outreachMessages.organization_id, orgId),
            gt(outreachMessages.created_at, sevenDaysAgo)
          )
        )
        .groupBy(
          sql`date_trunc('day', ${outreachMessages.created_at})`,
          outreachMessages.status
        ),

      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${campaigns.created_at}), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(campaigns)
        .where(
          and(eq(campaigns.organization_id, orgId), gt(campaigns.created_at, sevenDaysAgo))
        )
        .groupBy(sql`date_trunc('day', ${campaigns.created_at})`),

      db
        .select({
          day: sql<string>`to_char(date_trunc('day', ${researchReports.created_at}), 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(researchReports)
        .where(
          and(
            eq(researchReports.organization_id, orgId),
            gt(researchReports.created_at, sevenDaysAgo)
          )
        )
        .groupBy(sql`date_trunc('day', ${researchReports.created_at})`),
    ]);

    const totalProspects = totalProspectsResult[0]?.count ?? 0;
    const totalMessages = totalMessagesResult[0]?.count ?? 0;
    const totalCampaigns = totalCampaignsResult[0]?.count ?? 0;
    const activeCampaigns = activeCampaignsResult[0]?.count ?? 0;
    const totalResearch = totalResearchResult[0]?.count ?? 0;

    const prospectsByStatusMap: Record<string, number> = {};
    for (const row of prospectsByStatusResult) {
      prospectsByStatusMap[row.status] = row.count;
    }

    const messagesByStatusMap: Record<string, number> = {};
    for (const row of messagesByStatusResult) {
      messagesByStatusMap[row.status] = row.count;
    }

    const recentMessagesByStatus: Record<string, number> = {};
    for (const row of recentMessagesResult) {
      recentMessagesByStatus[row.status] = row.count;
    }

    const approvedMessages = messagesByStatusMap["APPROVED"] ?? 0;
    const sentMessages = messagesByStatusMap["SENT"] ?? 0;

    return NextResponse.json({
      overview: {
        totalProspects,
        totalMessages,
        totalCampaigns,
        activeCampaigns,
        totalResearch,
      },
      prospectsByStatus: prospectsByStatusMap,
      messagesByStatus: messagesByStatusMap,
      recentActivity: {
        messagesGenerated: recentMessagesByStatus["DRAFT"] ?? 0,
        messagesApproved: recentMessagesByStatus["APPROVED"] ?? 0,
        messagesSent: recentMessagesByStatus["SENT"] ?? 0,
      },
      rates: {
        approvalRate: totalMessages > 0 ? Math.round((approvedMessages / totalMessages) * 100) : 0,
        sendRate: approvedMessages > 0 ? Math.round((sentMessages / approvedMessages) * 100) : 0,
      },
      timeseries: {
        days: days.map((day) => day.toISOString().slice(0, 10)),
        prospects: buildSeries(prospectSeriesResult, days),
        messages: buildSeries(messageSeriesResult, days),
        messagesGenerated: buildSeries(
          messageSeriesResult.filter((row) => row.status === "DRAFT"),
          days
        ),
        messagesApproved: buildSeries(
          messageSeriesResult.filter((row) => row.status === "APPROVED"),
          days
        ),
        messagesSent: buildSeries(
          messageSeriesResult.filter((row) => row.status === "SENT"),
          days
        ),
        campaigns: buildSeries(campaignSeriesResult, days),
        research: buildSeries(researchSeriesResult, days),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
