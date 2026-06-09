"use client";

import { useState, useEffect } from "react";

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [resourceFilter, setResourceFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, resourceFilter]);

  async function fetchLogs() {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resourceType", resourceFilter);
      const res = await fetch(`/api/audit-logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>

      <div className="mt-4 flex gap-4">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Actions</option>
          <option value="USER_CREATED">User Created</option>
          <option value="USER_SIGNED_IN">User Signed In</option>
          <option value="PROSPECT_CREATED">Prospect Created</option>
          <option value="PROSPECT_UPDATED">Prospect Updated</option>
          <option value="PROSPECT_DELETED">Prospect Deleted</option>
          <option value="RESEARCH_STARTED">Research Started</option>
          <option value="OUTREACH_GENERATED">Outreach Generated</option>
          <option value="MESSAGE_APPROVED">Message Approved</option>
          <option value="MESSAGE_REJECTED">Message Rejected</option>
          <option value="EMAIL_SENT">Email Sent</option>
          <option value="GMAIL_CONNECTED">Gmail Connected</option>
          <option value="GMAIL_DISCONNECTED">Gmail Disconnected</option>
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => {
            setResourceFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Resources</option>
          <option value="USER">User</option>
          <option value="PROSPECT">Prospect</option>
          <option value="RESEARCH_REPORT">Research Report</option>
          <option value="OUTREACH_PACKAGE">Outreach Package</option>
          <option value="EMAIL_MESSAGE">Email Message</option>
          <option value="CAMPAIGN">Campaign</option>
        </select>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {log.resource_type}
                    {log.resource_id && (
                      <span className="ml-1 text-gray-400">
                        ({log.resource_id.slice(0, 8)}...)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.details ? (
                      <pre className="max-w-xs overflow-hidden text-xs">
                        {JSON.stringify(log.details, null, 0)}
                      </pre>
                    ) : (
                      "-"
                    )}
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
