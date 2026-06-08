"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  product_service: string | null;
  icp_description: string | null;
  sales_context: string | null;
  created_at: string;
}

interface CampaignProspect {
  id: string;
  prospect: {
    id: string;
    person_name: string;
    company_name: string;
    email: string | null;
    status: string;
  };
  status: string;
}

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [prospects, setProspects] = useState<CampaignProspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCampaign(data.campaign);
        setProspects(data.prospects ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to update campaign:", error);
    } finally {
      setUpdating(false);
    }
  }

  async function removeProspect(prospectId: string) {
    if (!confirm("Remove this prospect from the campaign?")) return;
    try {
      const res = await fetch(`/api/campaigns/${id}/prospects/${prospectId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to remove prospect:", error);
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    ACTIVE: "bg-green-100 text-green-800",
    PAUSED: "bg-yellow-100 text-yellow-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (!campaign) {
    return <div className="text-sm text-gray-500">Campaign not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
          {campaign.description && (
            <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[campaign.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {campaign.status}
          </span>
          {campaign.status === "DRAFT" && (
            <button
              onClick={() => updateStatus("ACTIVE")}
              disabled={updating}
              className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Activate
            </button>
          )}
          {campaign.status === "ACTIVE" && (
            <button
              onClick={() => updateStatus("PAUSED")}
              disabled={updating}
              className="rounded-md bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
            >
              Pause
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white shadow">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium text-gray-900">
                Prospects ({prospects.length})
              </h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {prospects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                      No prospects in this campaign yet.
                    </td>
                  </tr>
                ) : (
                  prospects.map((cp) => (
                    <tr key={cp.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {cp.prospect.person_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {cp.prospect.company_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            STATUS_COLORS[cp.status] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {cp.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <button
                          onClick={() => removeProspect(cp.prospect.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Campaign Settings</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Product/Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.product_service ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">ICP Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.icp_description ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Sales Context</dt>
                <dd className="mt-1 text-sm text-gray-900">{campaign.sales_context ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-4 space-y-2">
              <button
                onClick={() => router.push("/prospects")}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Add Prospects
              </button>
              <button
                onClick={() => router.push("/outreach")}
                className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View Outreach
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
