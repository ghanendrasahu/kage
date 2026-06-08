"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  product_service: string | null;
  status: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", productService: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const res = await fetch("/api/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          productService: form.productService || undefined,
        }),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm({ name: "", description: "", productService: "" });
        fetchCampaigns();
      }
    } catch (error) {
      console.error("Failed to create campaign:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          New Campaign
        </button>
      </div>

      {showCreate && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Create Campaign</h2>
          <form onSubmit={createCampaign} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Product/Service</label>
              <input
                type="text"
                value={form.productService}
                onChange={(e) => setForm((f) => ({ ...f, productService: e.target.value }))}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No campaigns yet. Create your first campaign to get started.
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow hover:shadow-md"
            >
              <h3 className="text-lg font-medium text-gray-900">{campaign.name}</h3>
              {campaign.description && (
                <p className="mt-1 text-sm text-gray-500">{campaign.description}</p>
              )}
              {campaign.product_service && (
                <p className="mt-2 text-xs text-gray-400">Product: {campaign.product_service}</p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    campaign.status === "ACTIVE"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {campaign.status}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
