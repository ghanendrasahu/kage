"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface Prospect {
  id: string;
  company_name: string;
  company_domain: string | null;
  person_name: string;
  person_title: string | null;
  email: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  status: string;
  notes: string | null;
  tags: string[];
  created_at: string;
}

interface ResearchReport {
  id: string;
  summary: string | null;
  status: string;
  confidence: number | null;
  created_at: string;
}

interface OutreachPackage {
  id: string;
  status: string;
  opportunity_score: number | null;
  created_at: string;
}

export default function ProspectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [prospect, setProspect] = useState<Prospect | null>(null);
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [packages, setPackages] = useState<OutreachPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ notes: "" });

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const [prospectRes, researchRes, outreachRes] = await Promise.all([
        fetch(`/api/prospects/${id}`),
        fetch(`/api/research?prospectId=${id}`),
        fetch(`/api/outreach?prospectId=${id}`),
      ]);

      if (prospectRes.ok) {
        const data = await prospectRes.json();
        setProspect(data.prospect);
        setForm({ notes: data.prospect.notes ?? "" });
      }
      if (researchRes.ok) {
        const data = await researchRes.json();
        setReports(data.reports ?? []);
      }
      if (outreachRes.ok) {
        const data = await outreachRes.json();
        setPackages(data.packages ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch prospect:", error);
    } finally {
      setLoading(false);
    }
  }

  async function saveNotes() {
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: form.notes }),
      });
      if (res.ok) {
        setEditing(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save notes:", error);
    }
  }

  async function startResearch() {
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: id,
          companyName: prospect?.company_name,
          companyDomain: prospect?.company_domain,
        }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to start research:", error);
    }
  }

  async function deleteProspect() {
    if (!confirm("Delete this prospect?")) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (res.ok) router.push("/prospects");
    } catch (error) {
      console.error("Failed to delete prospect:", error);
    }
  }

  const STATUS_COLORS: Record<string, string> = {
    NEW: "bg-gray-100 text-gray-800",
    RESEARCHING: "bg-blue-100 text-blue-800",
    RESEARCHED: "bg-green-100 text-green-800",
    DRAFTING: "bg-yellow-100 text-yellow-800",
    REVIEWING: "bg-orange-100 text-orange-800",
    APPROVED: "bg-green-100 text-green-800",
    SENT: "bg-purple-100 text-purple-800",
    REPLIED: "bg-indigo-100 text-indigo-800",
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading...</div>;
  }

  if (!prospect) {
    return <div className="text-sm text-gray-500">Prospect not found.</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{prospect.person_name}</h1>
          <p className="text-sm text-gray-500">
            {prospect.person_title && `${prospect.person_title} at `}
            {prospect.company_name}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[prospect.status] ?? "bg-gray-100 text-gray-800"}`}
          >
            {prospect.status}
          </span>
          <button
            onClick={deleteProspect}
            className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Contact Information</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{prospect.email ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900">{prospect.location ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Industry</dt>
                <dd className="mt-1 text-sm text-gray-900">{prospect.industry ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Company Size</dt>
                <dd className="mt-1 text-sm text-gray-900">{prospect.company_size ?? "-"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Notes</h2>
              <button
                onClick={() => (editing ? saveNotes() : setEditing(true))}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                {editing ? "Save" : "Edit"}
              </button>
            </div>
            {editing ? (
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ notes: e.target.value })}
                rows={4}
                className="mt-4 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            ) : (
              <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">
                {prospect.notes ?? "No notes yet."}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Research Reports</h2>
              <button
                onClick={startResearch}
                className="rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
              >
                Start Research
              </button>
            </div>
            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No research reports yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {reports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between rounded-md border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(report.created_at).toLocaleDateString()}
                      </p>
                      {report.summary && (
                        <p className="mt-1 text-xs text-gray-500 line-clamp-2">{report.summary}</p>
                      )}
                    </div>
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        report.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Outreach</h2>
            {packages.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No outreach packages yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="rounded-md border border-gray-100 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(pkg.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          pkg.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {pkg.status}
                      </span>
                    </div>
                    {pkg.opportunity_score !== null && (
                      <p className="mt-1 text-xs text-gray-500">
                        Score: {Math.round(pkg.opportunity_score)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
            <h2 className="text-lg font-medium text-gray-900">Details</h2>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Company Domain</dt>
                <dd className="mt-1 text-sm text-gray-900">{prospect.company_domain ?? "-"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(prospect.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase text-gray-500">Tags</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prospect.tags?.length > 0
                    ? prospect.tags.map((t) => (
                        <span
                          key={t}
                          className="mr-1 inline-flex rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          {t}
                        </span>
                      ))
                    : "-"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
