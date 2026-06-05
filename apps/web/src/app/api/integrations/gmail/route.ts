import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, gmailAccounts, integrations } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { IntegrationType } from "@kage/shared";
import { GmailOAuth } from "@kage/gmail";

export async function GET(
  request: NextRequest
) {
  return withAuth(async (request, context) => {
    try {
      const db = getDb();

      const accounts = await db
        .select({
          id: gmailAccounts.id,
          email: gmailAccounts.email,
          profile: gmailAccounts.profile,
          createdAt: gmailAccounts.created_at,
        })
        .from(gmailAccounts)
        .where(eq(gmailAccounts.user_id, context.userId));

      return NextResponse.json({ accounts });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function POST(
  request: NextRequest
) {
  return withAuth(async (request, context) => {
    try {
      const oauth = new GmailOAuth();
      const state = JSON.stringify({
        userId: context.userId,
        organizationId: context.organizationId,
      });
      const authUrl = oauth.getAuthUrl(Buffer.from(state).toString("base64"));

      return NextResponse.json({ authUrl });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}

export async function DELETE(
  request: NextRequest
) {
  return withAuth(async (request, context) => {
    try {
      const { searchParams } = new URL(request.url);
      const accountId = searchParams.get("accountId");

      if (!accountId) {
        return NextResponse.json(
          { error: "accountId is required" },
          { status: 400 }
        );
      }

      const db = getDb();

      const [existing] = await db
        .select()
        .from(gmailAccounts)
        .where(
          and(
            eq(gmailAccounts.id, accountId),
            eq(gmailAccounts.user_id, context.userId)
          )
        )
        .limit(1);

      if (!existing) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      await db
        .delete(gmailAccounts)
        .where(eq(gmailAccounts.id, accountId));

      return NextResponse.json({ success: true });
    } catch (error) {
      return handleApiError(error);
    }
  })(request);
}
