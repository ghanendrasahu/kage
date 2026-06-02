import { google } from "googleapis";
import { GmailOAuth } from "./oauth";
import type { GmailProfile, SendResult } from "./types";

export class GmailService {
  private oauth: GmailOAuth;

  constructor() {
    this.oauth = new GmailOAuth();
  }

  async sendEmail(params: {
    accessTokenEncrypted: string;
    refreshTokenEncrypted: string;
    to: string;
    subject: string;
    body: string;
    from?: string;
    idempotencyKey: string;
  }): Promise<SendResult> {
    try {
      const accessToken = await this.getAccessToken(
        params.accessTokenEncrypted,
        params.refreshTokenEncrypted
      );

      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });

      const gmail = google.gmail({ version: "v1", auth: oauth2Client });

      const emailParts = [
        `To: ${params.to}`,
        params.from ? `From: ${params.from}` : null,
        `Subject: ${params.subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=utf-8",
        "",
        params.body,
      ]
        .filter(Boolean)
        .join("\r\n");

      const encodedEmail = Buffer.from(emailParts)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedEmail,
        },
      });

      const messageId = response.data.id ?? undefined;

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: message,
      };
    }
  }

  async getProfile(accessTokenEncrypted: string, refreshTokenEncrypted: string): Promise<GmailProfile> {
    const accessToken = await this.getAccessToken(accessTokenEncrypted, refreshTokenEncrypted);
    return this.oauth.getProfile(accessToken);
  }

  private async getAccessToken(
    accessTokenEncrypted: string,
    refreshTokenEncrypted: string
  ): Promise<string> {
    try {
      const accessToken = this.oauth.decryptToken(accessTokenEncrypted);
      return accessToken;
    } catch {
      const { accessToken } = await this.oauth.refreshAccessToken(refreshTokenEncrypted);
      return accessToken;
    }
  }
}
