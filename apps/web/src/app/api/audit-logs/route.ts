import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, auditLogs } from "@kage/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuditAction } from "@kage/shared";

export const GET = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);
    const action = searchParams.get("action") as AuditAction | null;
    const resourceType = searchParams.get("resourceType");

    const db = getDb();
    const conditions = [eq(auditLogs.organization_id, context.organizationId)];

    if (action) {
      conditions.push(eq(auditLogs.action, action));
    }
    if (resourceType) {
      conditions.push(eq(auditLogs.resource_type, resourceType));
    }

    const [items, countResult] = await Promise.all([
      db
        .select()
        .from(auditLogs)
        .where(and(...conditions))
        .orderBy(desc(auditLogs.created_at))
        .limit(limit)
        .offset((page - 1) * limit),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(auditLogs)
        .where(and(...conditions)),
    ]);

    const total = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      auditLogs: items,
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
