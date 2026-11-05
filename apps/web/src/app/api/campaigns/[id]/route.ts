import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, campaigns, campaignProspects, prospects } from "@kage/db";
import { eq, and, desc, isNull } from "drizzle-orm";
import { CampaignStatus } from "@kage/shared";

const updateCampaignSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: z.nativeEnum(CampaignStatus).optional(),
  productService: z.string().optional(),
  icpDescription: z.string().optional(),
  salesContext: z.string().optional(),
});

const addProspectSchema = z.object({
  prospectId: z.string().uuid(),
});

async function loadCampaign(id: string, organizationId: string) {
  const db = getDb();

  const campaign = await db.query.campaigns.findFirst({
    where: and(
      eq(campaigns.id, id),
      eq(campaigns.organization_id, organizationId),
      isNull(campaigns.deleted_at)
    ),
  });

  if (!campaign) return null;

  const rows = await db
    .select({
      id: campaignProspects.id,
      status: campaignProspects.status,
      created_at: campaignProspects.created_at,
      prospect_id: prospects.id,
      person_name: prospects.person_name,
      person_title: prospects.person_title,
      company_name: prospects.company_name,
      email: prospects.email,
      prospect_status: prospects.status,
    })
    .from(campaignProspects)
    .innerJoin(prospects, eq(campaignProspects.prospect_id, prospects.id))
    .where(eq(campaignProspects.campaign_id, id))
    .orderBy(desc(campaignProspects.created_at));

  return {
    campaign,
    prospects: rows.map((row) => ({
      id: row.id,
      status: row.status,
      created_at: row.created_at,
      prospect: {
        id: row.prospect_id,
        person_name: row.person_name,
        person_title: row.person_title,
        company_name: row.company_name,
        email: row.email,
        status: row.prospect_status,
      },
    })),
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_request, context) => {
    try {
      const { id } = await params;
      const result = await loadCampaign(id, context.organizationId);

      if (!result) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json(result);
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
      const parsed = updateCampaignSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const db = getDb();
      const updates: Record<string, unknown> = { updated_at: new Date() };

      if (parsed.data.name !== undefined) updates["name"] = parsed.data.name;
      if (parsed.data.description !== undefined)
        updates["description"] = parsed.data.description;
      if (parsed.data.status !== undefined) updates["status"] = parsed.data.status;
      if (parsed.data.productService !== undefined)
        updates["product_service"] = parsed.data.productService;
      if (parsed.data.icpDescription !== undefined)
        updates["icp_description"] = parsed.data.icpDescription;
      if (parsed.data.salesContext !== undefined)
        updates["sales_context"] = parsed.data.salesContext;

      const [updated] = await db
        .update(campaigns)
        .set(updates)
        .where(
          and(
            eq(campaigns.id, id),
            eq(campaigns.organization_id, context.organizationId)
          )
        )
        .returning();

      if (!updated) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ campaign: updated });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = addProspectSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const db = getDb();
      const campaign = await db.query.campaigns.findFirst({
        where: and(
          eq(campaigns.id, id),
          eq(campaigns.organization_id, context.organizationId),
          isNull(campaigns.deleted_at)
        ),
      });

      if (!campaign) {
        return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
      }

      const prospect = await db.query.prospects.findFirst({
        where: and(
          eq(prospects.id, parsed.data.prospectId),
          eq(prospects.organization_id, context.organizationId)
        ),
      });

      if (!prospect) {
        return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
      }

      const [added] = await db
        .insert(campaignProspects)
        .values({ campaign_id: id, prospect_id: prospect.id })
        .onConflictDoNothing()
        .returning();

      return NextResponse.json({ campaignProspect: added ?? null }, { status: 201 });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const [deleted] = await db
        .update(campaigns)
        .set({ deleted_at: new Date(), updated_at: new Date() })
        .where(
          and(
            eq(campaigns.id, id),
            eq(campaigns.organization_id, context.organizationId)
          )
        )
        .returning({ id: campaigns.id });

      if (!deleted) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ deleted: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
