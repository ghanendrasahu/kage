import { NextRequest, NextResponse } from "next/server";
import { getDb, gmailAccounts, integrations } from "@kage/db";
import { eq, and } from "drizzle-orm";
import { IntegrationType } from "@kage/shared";
import { GmailOAuth } from "@kage/gmail";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.redirect(
        new URL("/integrations?error=missing_params", request.url)
      );
    }

    const stateData = JSON.parse(Buffer.from(state, "base64").toString());
    const { userId, organizationId } = stateData;

    if (!userId || !organizationId) {
      return NextResponse.redirect(
        new URL("/integrations?error=invalid_state", request.url)
      );
    }

    const oauth = new GmailOAuth();
    const tokens = await oauth.exchangeCode(code);
    const profile = await oauth.getProfile(tokens.accessToken);

    const db = getDb();

    const encryptedAccessToken = oauth.encryptToken(tokens.accessToken);
    const encryptedRefreshToken = oauth.encryptToken(tokens.refreshToken);

    const [existingIntegration] = await db
      .select()
      .from(integrations)
      .where(
        and(
          eq(integrations.user_id, userId),
          eq(integrations.type, IntegrationType.GMAIL)
        )
      )
      .limit(1);

    let integrationId = existingIntegration?.id;

    if (!existingIntegration) {
      const [newIntegration] = await db
        .insert(integrations)
        .values({
          organization_id: organizationId,
          user_id: userId,
          type: IntegrationType.GMAIL,
          status: "ACTIVE",
        })
        .returning();
      integrationId = newIntegration?.id;
    }

    const [existingAccount] = await db
      .select()
      .from(gmailAccounts)
      .where(
        and(
          eq(gmailAccounts.user_id, userId),
          eq(gmailAccounts.email, profile.email)
        )
      )
      .limit(1);

    if (existingAccount) {
      await db
        .update(gmailAccounts)
        .set({
          access_token_encrypted: encryptedAccessToken,
          refresh_token_encrypted: encryptedRefreshToken,
          token_expires_at: new Date(tokens.expiryDate),
          profile: profile as any,
          updated_at: new Date(),
        })
        .where(eq(gmailAccounts.id, existingAccount.id));
    } else {
      await db.insert(gmailAccounts).values({
        organization_id: organizationId,
        user_id: userId,
        integration_id: integrationId,
        email: profile.email,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: new Date(tokens.expiryDate),
        profile: profile as any,
      });
    }

    return NextResponse.redirect(
      new URL("/integrations?success=gmail_connected", request.url)
    );
  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect(
      new URL("/integrations?error=callback_failed", request.url)
    );
  }
}
