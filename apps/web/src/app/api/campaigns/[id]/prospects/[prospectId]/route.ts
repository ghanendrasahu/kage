import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, campaigns, campaignProspects } from "@kage/db";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; prospectId: string }> }
) {
  return withAuth(async (_request, context) => {
    try {
      const { id, prospectId } = await params;
      const db = getDb();

      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, id),
          eq(campaigns.organization_id, context.organizationId)
        ),
        columns: { id: true },
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      const [deleted] = await db
        .delete(campaignProspects)
        .where(
          and(
            eq(campaignProspects.campaign_id, id),
            eq(campaignProspects.prospect_id, prospectId)
          )
        )
        .returning({ id: campaignProspects.id });

      if (!deleted) {
        return NextResponse.json(
          { error: "Prospect is not in this campaign" },
          { status: 404 }
        );
      }

      return NextResponse.json({ deleted: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
