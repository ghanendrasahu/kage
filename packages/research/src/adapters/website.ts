import { validateUrl } from "@kage/security";
import type { ResearchAdapter, AdapterResult } from "../types";

const TIMEOUT_MS = 10000;

const BLOCKED_PATHS = [
  "/wp-admin",
  "/wp-login",
  "/admin",
  "/login",
  "/dashboard",
  "/api/",
  "/.env",
  "/.git",
];

export class WebsiteAdapter implements ResearchAdapter {
  name = "website";

  async fetch(params: {
    companyDomain?: string;
    companyName: string;
    queries?: string[];
  }): Promise<AdapterResult[]> {
    if (!params.companyDomain) {
      return [];
    }

    const baseUrl = params.companyDomain.startsWith("http")
      ? params.companyDomain
      : `https://${params.companyDomain}`;

    const validation = validateUrl(baseUrl);
    if (!validation.safe) {
      return [];
    }

    const results: AdapterResult[] = [];

    const pagesToFetch = [
      "",
      "/about",
      "/about-us",
      "/company",
      "/team",
      "/leadership",
      "/press",
      "/news",
      "/blog",
      "/careers",
    ];

    for (const page of pagesToFetch) {
      if (BLOCKED_PATHS.some((blocked) => page.includes(blocked))) {
        continue;
      }

      try {
        const url = `${baseUrl}${page}`;
        const pageValidation = validateUrl(url);
        if (!pageValidation.safe) continue;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "KAGE Research Bot/1.0 (research@example.com)",
            Accept: "text/html",
          },
          redirect: "follow",
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html")) continue;

        const text = await response.text();

        const titleMatch = text.match(/<title[^>]*>([^<]*)<\/title>/i);
        const title = titleMatch?.[1]?.trim() ?? "Untitled";

        const cleanContent = text
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 5000);

        results.push({
          url,
          title,
          content: cleanContent,
          sourceType: "company_website",
          fetchedAt: new Date(),
        });
      } catch {
        continue;
      }
    }

    return results;
  }
}
