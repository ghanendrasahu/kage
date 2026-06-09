"use client";

import { useState, useEffect } from "react";

interface GmailAccount {
  id: string;
  email: string;
  connected: boolean;
}

export default function IntegrationsPage() {
  const [accounts, setAccounts] = useState<GmailAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  async function fetchAccounts() {
    try {
      const res = await fetch("/api/integrations/gmail");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.accounts ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch Gmail accounts:", error);
    } finally {
      setLoading(false);
    }
  }

  async function connectGmail() {
    setConnecting(true);
    try {
      const res = await fetch("/api/integrations/gmail", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (data.url) window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to connect Gmail:", error);
      setConnecting(false);
    }
  }

  async function disconnectGmail(accountId: string) {
    if (!confirm("Disconnect this Gmail account?")) return;
    try {
      const res = await fetch(`/api/integrations/gmail?accountId=${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchAccounts();
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Gmail</h2>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Gmail account to send outreach messages.
          </p>
        </div>
        <div className="px-6 py-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : accounts.length === 0 ? (
            <div>
              <p className="text-sm text-gray-500">No Gmail accounts connected.</p>
              <button
                onClick={connectGmail}
                disabled={connecting}
                className="mt-4 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {connecting ? "Connecting..." : "Connect Gmail Account"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between rounded-md border border-gray-200 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 18.75h-7.5V6H20v12.75zM6.75 18.75H20V6H6.75v12.75zM2.25 18.75V6l4.5-3v15.75l-4.5 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{account.email}</p>
                      <p className="text-xs text-gray-500">
                        {account.connected ? "Connected" : "Disconnected"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => disconnectGmail(account.id)}
                    className="text-sm text-red-600 hover:text-red-900"
                  >
                    Disconnect
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
