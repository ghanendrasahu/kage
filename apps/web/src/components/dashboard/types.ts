export interface Analytics {
  overview: {
    totalProspects: number;
    totalMessages: number;
    totalCampaigns: number;
    activeCampaigns: number;
    totalResearch: number;
  };
  prospectsByStatus: Record<string, number>;
  messagesByStatus: Record<string, number>;
  recentActivity: {
    messagesGenerated: number;
    messagesApproved: number;
    messagesSent: number;
  };
  rates: {
    approvalRate: number;
    sendRate: number;
  };
  timeseries: {
    days: string[];
    prospects: number[];
    messages: number[];
    messagesGenerated: number[];
    messagesApproved: number[];
    messagesSent: number[];
    campaigns: number[];
    research: number[];
  };
}

export interface Campaign {
  id: string;
  name: string;
  description: string | null;
  product_service: string | null;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}
