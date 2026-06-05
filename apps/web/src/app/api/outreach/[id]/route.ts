import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, outreachPackages, outreachMessages } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { MessageStatus, MESSAGE_TRANSITIONS } from "@kage/shared";

const updateMessageSchema = z.object({
  subject: z.string().max(500).optional(),
  body: z.string().min(1).optional(),
  cta: z.string().optional(),
  status: z.nativeEnum(MessageStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
      const db = getDb();

      const [outreachPackage] = await db
        .select()
        .from(outreachPackages)
        .where(
          and(
            eq(outreachPackages.id, id),
            eq(outreachPackages.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!outreachPackage) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      const messages = await db
        .select()
        .from(outreachMessages)
        .where(eq(outreachMessages.package_id, id));

      return NextResponse.json({
        outreachPackage: {
          ...outreachPackage,
          messages,
        },
      });
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
      const parsed = updateMessageSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }

      const db = getDb();

      const [existing] = await db
        .select()
        .from(outreachMessages)
        .where(
          and(
            eq(outreachMessages.id, id),
            eq(outreachMessages.organization_id, context.organizationId)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      if (parsed.data.status && parsed.data.status !== existing.status) {
        const currentStatus = existing.status as MessageStatus;
        const allowedTransitions = MESSAGE_TRANSITIONS[currentStatus];
        if (!allowedTransitions.includes(parsed.data.status)) {
          return NextResponse.json(
            { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
            { status: 400 }
          );
        }
      }

      const updateData: Record<string, unknown> = {};
      if (parsed.data.subject !== undefined) updateData["subject"] = parsed.data.subject;
      if (parsed.data.body !== undefined) updateData["body"] = parsed.data.body;
      if (parsed.data.cta !== undefined) updateData["cta"] = parsed.data.cta;
      if (parsed.data.status !== undefined) updateData["status"] = parsed.data.status;
      updateData["updated_at"] = new Date();
      updateData["edited_by"] = context.userId;
      updateData["edited_at"] = new Date();

      const [updated] = await db
        .update(outreachMessages)
        .set(updateData as any)
        .where(
          and(
            eq(outreachMessages.id, id),
            eq(outreachMessages.organization_id, context.organizationId)
          )
        )
        .returning();

      return NextResponse.json({ message: updated });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
