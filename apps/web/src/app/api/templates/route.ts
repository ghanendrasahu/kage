import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb } from "@kage/db";
import { sql } from "drizzle-orm";

const createTemplateSchema = z.object({
  name: z.string().min(1).max(255),
  channel: z.enum(["EMAIL", "LINKEDIN"]),
  subject: z.string().max(500).optional(),
  body: z.string().min(1),
  is_default: z.boolean().optional(),
});

export const GET = withAuth(async (_request, context) => {
  try {
    const db = getDb();
    const result = await db.execute(sql`
      SELECT id, name, channel, subject, body, variables, is_default, created_at
      FROM email_templates
      WHERE organization_id = ${context.organizationId}
      ORDER BY created_at DESC
    `);
    return NextResponse.json({ templates: result ?? [] });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, context) => {
  try {
    const body = await request.json();
    const parsed = createTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!["OWNER", "ADMIN", "MANAGER"].includes(context.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = getDb();
    const variables = extractVariables(parsed.data.body);
    if (parsed.data.subject) {
      variables.push(...extractVariables(parsed.data.subject));
    }
    const uniqueVars = [...new Set(variables)];

    const result = await db.execute(sql`
      INSERT INTO email_templates (organization_id, name, channel, subject, body, variables, is_default, created_at, updated_at)
      VALUES (${context.organizationId}, ${parsed.data.name}, ${parsed.data.channel}, ${parsed.data.subject ?? null}, ${parsed.data.body}, ${JSON.stringify(uniqueVars)}, ${parsed.data.is_default ?? false}, NOW(), NOW())
      RETURNING id, name, channel, subject, body, variables, is_default, created_at
    `);

    return NextResponse.json({ template: result?.[0] }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? [];
  return matches.map((m) => m.replace(/\{\{|\}\}/g, ""));
}
