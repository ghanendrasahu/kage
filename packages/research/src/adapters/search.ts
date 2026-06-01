import { validateUrl } from "@kage/security";
import type { ResearchAdapter, AdapterResult } from "../types";

const TIMEOUT_MS = 10000;

export class SearchAdapter implements ResearchAdapter {
  name = "search";

  async fetch(params: {
    companyDomain?: string;
    companyName: string;
    queries?: string[];
  }): Promise<AdapterResult[]> {
    const results: AdapterResult[] = [];

    const searchQueries = params.queries ?? [
      `${params.companyName} company information`,
      `${params.companyName} industry`,
      `${params.companyName} products services`,
    ];

    for (const query of searchQueries.slice(0, 3)) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://html.duckduckgo.com/html/?q=${encodedQuery}`;

        const validation = validateUrl(url);
        if (!validation.safe) continue;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "KAGE Research Bot/1.0 (research@example.com)",
            Accept: "text/html",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const text = await response.text();

        const results_match = text.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi) ?? [];
        const snippets = text.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi) ?? [];

        for (let i = 0; i < Math.min(results_match.length, 5); i++) {
          const linkMatch = results_match[i]?.match(/href="([^"]*)"/);
          const titleMatch = results_match[i]?.match(/>([^<]*)<\/a>/);
          const snippet = snippets[i]?.replace(/<[^>]+>/g, "").trim() ?? "";

          const link = linkMatch?.[1] ?? "";
          const title = titleMatch?.[1]?.trim() ?? "Untitled";

          if (link) {
            const linkValidation = validateUrl(link);
            if (linkValidation.safe) {
              results.push({
                url: link,
                title,
                content: snippet,
                sourceType: "search",
                fetchedAt: new Date(),
              });
            }
          }
        }
      } catch {
        continue;
      }
    }

    return results;
  }
}
