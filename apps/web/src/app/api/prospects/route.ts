import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, prospects } from "@kage/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { ProspectStatus } from "@kage/shared";

const createProspectSchema = z.object({
  companyName: z.string().min(1).max(255),
  companyDomain: z.string().max(255).optional(),
  companyLinkedinUrl: z.string().url().optional(),
  personName: z.string().min(1).max(255),
  personTitle: z.string().max(255).optional(),
  personLinkedinUrl: z.string().url().optional(),
  email: z.string().email().optional(),
  industry: z.string().max(255).optional(),
  companySize: z.string().max(50).optional(),
  location: z.string().max(255).optional(),
  source: z.string().max(255).optional(),
  notes: z.string().optional(),
  campaignId: z.string().uuid().optional(),
});

export const GET = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
    const status = searchParams.get("status") as ProspectStatus | null;

    const db = getDb();
    const conditions = [eq(prospects.organization_id, context.organizationId)];

    if (status) {
      conditions.push(eq(prospects.status, status));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(prospects)
        .where(and(...conditions))
        .orderBy(desc(prospects.created_at))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(prospects)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      prospects: items,
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
    const parsed = createProspectSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const db = getDb();

    const [prospect] = await db
      .insert(prospects)
      .values({
        organization_id: context.organizationId,
        company_name: parsed.data.companyName,
        company_domain: parsed.data.companyDomain,
        company_linkedin_url: parsed.data.companyLinkedinUrl,
        person_name: parsed.data.personName,
        person_title: parsed.data.personTitle,
        person_linkedin_url: parsed.data.personLinkedinUrl,
        email: parsed.data.email,
        industry: parsed.data.industry,
        company_size: parsed.data.companySize,
        location: parsed.data.location,
        source: parsed.data.source,
        notes: parsed.data.notes,
        created_by: context.userId,
        status: ProspectStatus.NEW,
      })
      .returning();

    return NextResponse.json({ prospect }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
