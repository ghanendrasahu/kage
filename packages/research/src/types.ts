export interface AdapterResult {
  url: string;
  title: string;
  content: string;
  sourceType: string;
  fetchedAt: Date;
}

export interface ResearchAdapter {
  name: string;
  fetch(params: {
    companyDomain?: string;
    companyName: string;
    queries?: string[];
  }): Promise<AdapterResult[]>;
}
