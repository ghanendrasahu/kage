"use client";

import { useState, useEffect } from "react";

interface OutreachPackage {
  id: string;
  prospect_id: string;
  company_name: string;
  messages: Array<{
    channel: string;
    subject?: string;
    body: string;
    status: string;
  }>;
  status: string;
  created_at: string;
}

export default function OutreachPage() {
  const [packages, setPackages] = useState<OutreachPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchPackages();
  }, [page]);

  async function fetchPackages() {
    try {
      const res = await fetch(`/api/outreach?page=${page}&limit=20`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Failed to fetch outreach:", error);
    } finally {
      setLoading(false);
    }
  }

  async function approveMessage(messageId: string) {
    try {
      const res = await fetch(`/api/outreach/${messageId}/approve`, { method: "POST" });
      if (res.ok) fetchPackages();
    } catch (error) {
      console.error("Failed to approve message:", error);
    }
  }

  async function rejectMessage(messageId: string) {
    try {
      const res = await fetch(`/api/outreach/${messageId}/reject`, { method: "POST" });
      if (res.ok) fetchPackages();
    } catch (error) {
      console.error("Failed to reject message:", error);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Outreach Messages</h1>
      </div>

      <div className="mt-6 space-y-4">
        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            Loading...
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
            No outreach packages yet.
          </div>
        ) : (
          packages.map((pkg) => (
            <div key={pkg.id} className="rounded-lg border border-gray-200 bg-white shadow">
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{pkg.company_name}</h3>
                    <p className="text-sm text-gray-500">
                      Created {new Date(pkg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      pkg.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : pkg.status === "SENT"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {pkg.status}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {pkg.messages.map((msg, idx) => (
                  <div key={idx} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase text-gray-500">
                          {msg.channel}
                        </span>
                        {msg.subject && (
                          <span className="text-sm font-medium text-gray-900">{msg.subject}</span>
                        )}
                      </div>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          msg.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : msg.status === "SENT"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{msg.body}</p>
                    {msg.status === "DRAFT" && (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => approveMessage(msg.channel === "EMAIL" ? pkg.id : pkg.id)}
                          className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectMessage(msg.channel === "EMAIL" ? pkg.id : pkg.id)}
                          className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
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
