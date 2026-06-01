import type { ResearchAdapter, AdapterResult } from "../types";
import { WebsiteAdapter } from "../adapters/website";
import { NewsAdapter } from "../adapters/news";
import { SearchAdapter } from "../adapters/search";

export interface PipelineInput {
  companyName: string;
  companyDomain?: string;
  targetPersona?: string;
  productService?: string;
}

export interface PipelineResult {
  rawContent: AdapterResult[];
  uniqueUrls: string[];
  totalSources: number;
}

export class ResearchPipeline {
  private adapters: ResearchAdapter[];

  constructor() {
    this.adapters = [
      new WebsiteAdapter(),
      new NewsAdapter(),
      new SearchAdapter(),
    ];
  }

  async execute(input: PipelineInput): Promise<PipelineResult> {
    const allResults: AdapterResult[] = [];

    const adapterPromises = this.adapters.map(async (adapter) => {
      try {
        return await adapter.fetch({
          companyDomain: input.companyDomain,
          companyName: input.companyName,
        });
      } catch {
        return [];
      }
    });

    const adapterResults = await Promise.allSettled(adapterPromises);

    for (const result of adapterResults) {
      if (result.status === "fulfilled") {
        allResults.push(...result.value);
      }
    }

    const uniqueUrls = [...new Set(allResults.map((r) => r.url))];

    const deduplicatedResults = allResults.filter((r, index) => {
      const firstIndex = allResults.findIndex((fr) => fr.url === r.url);
      return index === firstIndex;
    });

    return {
      rawContent: deduplicatedResults,
      uniqueUrls,
      totalSources: uniqueUrls.length,
    };
  }
}
