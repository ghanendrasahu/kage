"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Prospect {
  id: string;
  company_name: string;
  company_domain: string | null;
  person_name: string;
  person_title: string | null;
  email: string | null;
  industry: string | null;
  company_size: string | null;
  status: string;
  created_at: string;
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

export default function ProspectsPage() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchProspects();
  }, [page, statusFilter]);

  async function fetchProspects() {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/prospects?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Failed to fetch prospects:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProspect(id: string) {
    if (!confirm("Delete this prospect?")) return;
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (res.ok) fetchProspects();
    } catch (error) {
      console.error("Failed to delete prospect:", error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prospects</h1>
        <Link
          href="/prospects/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add Prospect
        </Link>
      </div>

      <div className="mt-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="RESEARCHING">Researching</option>
          <option value="RESEARCHED">Researched</option>
          <option value="DRAFTING">Drafting</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="APPROVED">Approved</option>
          <option value="SENT">Sent</option>
          <option value="REPLIED">Replied</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Industry
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : prospects.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                  No prospects found. Add your first prospect to get started.
                </td>
              </tr>
            ) : (
              prospects.map((prospect) => (
                <tr key={prospect.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{prospect.company_name}</div>
                    {prospect.company_domain && (
                      <div className="text-sm text-gray-500">{prospect.company_domain}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{prospect.person_name}</div>
                    {prospect.person_title && (
                      <div className="text-sm text-gray-500">{prospect.person_title}</div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {prospect.industry ?? "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLORS[prospect.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {prospect.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link
                      href={`/research?prospectId=${prospect.id}`}
                      className="mr-3 text-indigo-600 hover:text-indigo-900"
                    >
                      Research
                    </Link>
                    <button
                      onClick={() => deleteProspect(prospect.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
