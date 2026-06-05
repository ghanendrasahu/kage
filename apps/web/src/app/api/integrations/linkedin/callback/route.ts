import { NextRequest, NextResponse } from "next/server";
import { getDb, integrations } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { IntegrationType } from "@kage/shared";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(
        new URL(`/integrations?error=${error}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_params", request.url)
      );
    }

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env["NEXT_PUBLIC_APP_URL"]}/api/integrations/linkedin/callback`,
        client_id: process.env["LINKEDIN_CLIENT_ID"] ?? "",
        client_secret: process.env["LINKEDIN_CLIENT_SECRET"] ?? "",
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(
        new URL("/integrations?error=token_exchange_failed", request.url)
      );
    }

    const tokenData = await tokenRes.json();

    const profileRes = await fetch("https://api.linkedin.com/v2/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    let profile: Record<string, unknown> = {};
    if (profileRes.ok) {
      profile = await profileRes.json();
    }

    const db = getDb();
    const existing = await db.query.integrations.findFirst({
      where: and(
        eq(integrations.organization_id, state),
        eq(integrations.type, IntegrationType.LINKEDIN)
      ),
    });

    if (existing) {
      await db
        .update(integrations)
        .set({
          status: "ACTIVE",
          config: {
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
          },
          metadata: { profile },
          updated_at: new Date(),
        })
        .where(eq(integrations.id, existing.id));
    } else {
      await db.insert(integrations).values({
        organization_id: state,
        user_id: "system",
        type: IntegrationType.LINKEDIN,
        status: "ACTIVE",
        config: {
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in,
        },
        metadata: { profile },
      });
    }

    return NextResponse.redirect(new URL("/integrations?success=linkedin", request.url));
  } catch (error) {
    console.error("LinkedIn callback error:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=internal_error", request.url)
    );
  }
}
