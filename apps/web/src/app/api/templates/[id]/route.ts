import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb } from "@kage/db";
import { sql } from "drizzle-orm";

const updateTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  channel: z.enum(["EMAIL", "LINKEDIN"]).optional(),
  subject: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
});

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_request, context) => {
    try {
      const { id } = await params;
      const db = getDb();
      const result = await db.execute(sql`
        SELECT id, name, channel, subject, body, variables, is_default, created_at
        FROM email_templates
        WHERE id = ${id} AND organization_id = ${context.organizationId}
      `);
      if (!result?.[0]) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json({ template: result[0] });
    } catch (error) {
      return handleApiError(error);
    }
  })(_request);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const parsed = updateTemplateSchema.safeParse(body);

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
      const updates: string[] = [];
      const values: unknown[] = [];

      if (parsed.data.name !== undefined) {
        updates.push(`name = $${values.length + 1}`);
        values.push(parsed.data.name);
      }
      if (parsed.data.subject !== undefined) {
        updates.push(`subject = $${values.length + 1}`);
        values.push(parsed.data.subject);
      }
      if (parsed.data.body !== undefined) {
        updates.push(`body = $${values.length + 1}`);
        values.push(parsed.data.body);
        const vars = [...new Set((parsed.data.body.match(/\{\{(\w+)\}\}/g) ?? []).map((m) => m.replace(/\{\{|\}\}/g, "")))];
        updates.push(`variables = $${values.length + 1}`);
        values.push(JSON.stringify(vars));
      }
      if (parsed.data.is_default !== undefined) {
        updates.push(`is_default = $${values.length + 1}`);
        values.push(parsed.data.is_default);
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: "No updates provided" }, { status: 400 });
      }

      updates.push(`updated_at = NOW()`);

      const result = await db.execute(sql`
        UPDATE email_templates
        SET ${sql.join(updates.map((u) => sql.raw(u)), sql`, `)}
        WHERE id = ${id} AND organization_id = ${context.organizationId}
        RETURNING id, name, channel, subject, body, variables, is_default, created_at
      `);

      if (!result?.[0]) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ template: result[0] });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (_request, context) => {
    try {
      const { id } = await params;

      if (!["OWNER", "ADMIN", "MANAGER"].includes(context.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const db = getDb();
      const result = await db.execute(sql`
        DELETE FROM email_templates
        WHERE id = ${id} AND organization_id = ${context.organizationId}
        RETURNING id
      `);

      if (!result?.[0]) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(_request);
}
