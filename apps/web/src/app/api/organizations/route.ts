import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, organizations, organizationMembers } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { slugify } from "@kage/shared";

const createOrganizationSchema = z.object({
  name: z.string().min(1).max(255),
  website: z.string().url().optional(),
});

export const GET = withAuth(async (request, context) => {
  const db = getDb();

  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.user_id, context.userId),
    with: {
      organization: true,
    },
  });

  const orgs = memberships.map((m) => m.organization);

  return NextResponse.json({ organizations: orgs });
});

export const POST = withAuth(async (request, context) => {
  try {
    const body = await request.json();
    const parsed = createOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, website } = parsed.data;
    const db = getDb();

    const baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const [org] = await db
      .insert(organizations)
      .values({
        name,
        slug,
        website,
      })
      .returning();

    if (!org) {
      return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
    }

    await db.insert(organizationMembers).values({
      organization_id: org.id,
      user_id: context.userId,
      role: "OWNER",
      joined_at: new Date(),
    });

    return NextResponse.json({ organization: org }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
