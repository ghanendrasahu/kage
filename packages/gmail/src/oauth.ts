import { google } from "googleapis";
import { encrypt, decrypt } from "@kage/security";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export class GmailOAuth {
  private oauth2Client;

  constructor() {
    const clientId = process.env["GOOGLE_CLIENT_ID"];
    const clientSecret = process.env["GOOGLE_CLIENT_SECRET"];
    const redirectUri = `${process.env["NEXT_PUBLIC_APP_URL"]}/api/integrations/gmail/callback`;

    if (!clientId || !clientSecret) {
      throw new Error("Google OAuth credentials are required");
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  }

  getAuthUrl(state: string): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: SCOPES,
      state,
      prompt: "consent",
    });
  }

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token || !tokens.expiry_date) {
      throw new Error("Failed to obtain tokens");
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    };
  }

  async refreshAccessToken(refreshTokenEncrypted: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }> {
    const refreshToken = decrypt(refreshTokenEncrypted);

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();

    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error("Failed to refresh token");
    }

    return {
      accessToken: credentials.access_token,
      expiryDate: credentials.expiry_date,
    };
  }

  async getProfile(accessToken: string): Promise<{
    email: string;
    name: string;
    picture?: string;
  }> {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email ?? "",
      name: data.name ?? "",
      picture: data.picture ?? undefined,
    };
  }

  encryptToken(token: string): string {
    return encrypt(token);
  }

  decryptToken(encryptedToken: string): string {
    return decrypt(encryptedToken);
  }
}
