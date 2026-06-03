import { z } from "zod";

const linkedinConfigSchema = z.object({
  access_token: z.string(),
  expires_in: z.number().optional(),
});

export interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
  headline: string;
  profilePicture?: string;
}

export interface LinkedInPost {
  id: string;
  commentary: string;
  created: { time: number };
  visibility: string;
}

export class LinkedInService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  static fromConfig(config: unknown): LinkedInService {
    const parsed = linkedinConfigSchema.parse(config);
    return new LinkedInService(parsed.access_token);
  }

  private async request<T>(endpoint: string): Promise<T> {
    const res = await fetch(`https://api.linkedin.com${endpoint}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "LinkedIn-Version": "202401",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });

    if (!res.ok) {
      throw new Error(`LinkedIn API error: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<T>;
  }

  async getProfile(): Promise<LinkedInProfile> {
    return this.request<LinkedInProfile>("/v2/me?projection=(id,firstName,lastName,headline,profilePicture~:playableStreams)");
  }

  async getEmail(): Promise<string> {
    const res = await this.request<{ elements: Array<{ handleCatchAllAccount: string; emailAddress: string }> }>(
      "/v2/emailAddress?q=members&projection=(elements*(handleCatchAllAccount,emailAddress))"
    );
    return res.elements?.[0]?.emailAddress ?? "";
  }

  async getRecentPosts(urn: string, count = 10): Promise<LinkedInPost[]> {
    const res = await this.request<{ elements: LinkedInPost[] }>(
      `/v2/ugcPosts?q=authors&authors=List(${urn})&count=${count}`
    );
    return res.elements ?? [];
  }

  async sendMessage(recipientUrn: string, message: string): Promise<boolean> {
    try {
      await fetch("https://api.linkedin.com/v2/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          recipient: recipientUrn,
          body: message,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  async sharePost(content: string, visibility = "PUBLIC"): Promise<boolean> {
    try {
      const profile = await this.getProfile();
      const authorUrn = `urn:li:person:${profile.id}`;

      await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
          "LinkedIn-Version": "202401",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: authorUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: { text: content },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": visibility,
          },
        }),
      });
      return true;
    } catch {
      return false;
    }
  }
}
