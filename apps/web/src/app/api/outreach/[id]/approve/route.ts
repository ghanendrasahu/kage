import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, outreachMessages } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { MessageStatus, MESSAGE_TRANSITIONS } from "@kage/shared";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (request, context) => {
    try {
      const { id } = await params;
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

      const currentStatus = existing.status as MessageStatus;
      const allowedTransitions = MESSAGE_TRANSITIONS[currentStatus];
      if (!allowedTransitions.includes(MessageStatus.APPROVED)) {
        return NextResponse.json(
          { error: `Cannot approve message in ${existing.status} status` },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(outreachMessages)
        .set({
          status: MessageStatus.APPROVED,
          approved_by: context.userId,
          approved_at: new Date(),
          updated_at: new Date(),
        } as any)
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
