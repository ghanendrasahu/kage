import { NextRequest, NextResponse } from "next/server";
import { withAuth, handleApiError } from "@/lib/api";
import { getDb, integrations } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { IntegrationType } from "@kage/shared";

export const GET = withAuth(async (_request, context) => {
  try {
    const db = getDb();
    const accounts = await db.query.integrations.findMany({
      where: and(
        eq(integrations.organization_id, context.organizationId),
        eq(integrations.type, IntegrationType.LINKEDIN)
      ),
      columns: {
        id: true,
        status: true,
        config: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        connected: a.status === "ACTIVE",
        config: a.config,
        created_at: a.created_at,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request, context) => {
  try {
    const body = await request.json().catch(() => ({}));

    const linkedinAuthUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    linkedinAuthUrl.searchParams.set("response_type", "code");
    linkedinAuthUrl.searchParams.set("client_id", process.env["LINKEDIN_CLIENT_ID"] ?? "");
    linkedinAuthUrl.searchParams.set("redirect_uri", `${process.env["NEXT_PUBLIC_APP_URL"]}/api/integrations/linkedin/callback`);
    linkedinAuthUrl.searchParams.set("scope", "r_liteprofile r_emailaddress w_member_social");
    linkedinAuthUrl.searchParams.set("state", context.organizationId);

    return NextResponse.json({ url: linkedinAuthUrl.toString() });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");

    if (!accountId) {
      return NextResponse.json({ error: "accountId is required" }, { status: 400 });
    }

    const db = getDb();
    await db
      .update(integrations)
      .set({ status: "DISCONNECTED" })
      .where(
        and(
          eq(integrations.id, accountId),
          eq(integrations.organization_id, context.organizationId),
          eq(integrations.type, IntegrationType.LINKEDIN)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
