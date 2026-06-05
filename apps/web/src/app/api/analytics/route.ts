import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, prospects, outreachMessages, campaigns, researchReports } from "@kage/db";
import { eq, and, gt, sql } from "drizzle-orm";
import { ProspectStatus, MessageStatus, CampaignStatus } from "@kage/shared";

export const GET = withAuth(async (request, context) => {
  try {
    const db = getDb();
    const orgId = context.organizationId;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalProspectsResult,
      prospectsByStatusResult,
      totalMessagesResult,
      messagesByStatusResult,
      totalCampaignsResult,
      activeCampaignsResult,
      totalResearchResult,
      recentMessagesResult,
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
    });
  } catch (error) {
    return handleApiError(error);
  }
});
