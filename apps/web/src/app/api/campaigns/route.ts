import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, campaigns } from "@kage/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { CampaignStatus } from "@kage/shared";

const createCampaignSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  productService: z.string().optional(),
  icpDescription: z.string().optional(),
  salesContext: z.string().optional(),
});

export const GET = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);

    const db = getDb();

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(campaigns)
        .where(eq(campaigns.organization_id, context.organizationId))
        .orderBy(desc(campaigns.created_at))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(campaigns)
        .where(eq(campaigns.organization_id, context.organizationId)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      campaigns: items,
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
    const parsed = createCampaignSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [campaign] = await db
      .insert(campaigns)
      .values({
        organization_id: context.organizationId,
        name: parsed.data.name,
        description: parsed.data.description,
        product_service: parsed.data.productService,
        icp_description: parsed.data.icpDescription,
        sales_context: parsed.data.salesContext,
        status: CampaignStatus.DRAFT,
      })
      .returning();

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
