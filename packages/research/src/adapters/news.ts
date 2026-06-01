import { validateUrl } from "@kage/security";
import type { ResearchAdapter, AdapterResult } from "../types";

const TIMEOUT_MS = 10000;

export class NewsAdapter implements ResearchAdapter {
  name = "news";

  async fetch(params: {
    companyDomain?: string;
    companyName: string;
    queries?: string[];
  }): Promise<AdapterResult[]> {
    const results: AdapterResult[] = [];

    const searchQueries = params.queries ?? [
      `${params.companyName} news`,
      `${params.companyName} funding`,
      `${params.companyName} announcement`,
    ];

    for (const query of searchQueries.slice(0, 3)) {
      try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;

        const validation = validateUrl(url);
        if (!validation.safe) continue;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            Accept: "application/rss+xml, application/xml, text/xml",
          },
        });

        clearTimeout(timeout);

        if (!response.ok) continue;

        const text = await response.text();

        const items = text.match(/<item>[\s\S]*?<\/item>/g) ?? [];

        for (const item of items.slice(0, 5)) {
          const titleMatch = item.match(/<title[^>]*>([^<]*)<\/title>/i);
          const linkMatch = item.match(/<link[^>]*>([^<]*)<\/link>/i);
          const descMatch = item.match(/<description[^>]*>([^<]*)<\/description>/i);
          const dateMatch = item.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/i);

          const title = titleMatch?.[1]?.trim() ?? "Untitled";
          const link = linkMatch?.[1]?.trim() ?? "";
          const description = descMatch?.[1]?.trim() ?? "";
          const date = dateMatch?.[1]?.trim() ?? "";

          if (link) {
            results.push({
              url: link,
              title,
              content: description,
              sourceType: "news",
              fetchedAt: new Date(),
            });
          }
        }
      } catch {
        continue;
      }
    }

    return results;
  }
}
