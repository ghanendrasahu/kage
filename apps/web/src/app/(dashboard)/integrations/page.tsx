"use client";

import * as React from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Plug,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

interface GmailAccount {
  id: string;
  email: string;
  profile?: { name?: string } | null;
  createdAt?: string;
}

interface LinkedinAccount {
  id: string;
  connected: boolean;
  created_at?: string;
}

function LinkedinGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 100 3.92 1.96 1.96 0 000-3.92zM20.44 20h-3.38v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.65V8.5h3.25v1.57h.05c.45-.86 1.56-1.77 3.2-1.77 3.43 0 4.06 2.26 4.06 5.2V20z" />
    </svg>
  );
}

function GmailGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M20.5 5h-17A1.5 1.5 0 002 6.5v11A1.5 1.5 0 003.5 19h17a1.5 1.5 0 001.5-1.5v-11A1.5 1.5 0 0020.5 5zm-.5 2v10.5H4V7l8 5.6L20 7z" />
    </svg>
  );
}

export default function IntegrationsPage() {
  const [gmailAccounts, setGmailAccounts] = React.useState<GmailAccount[]>([]);
  const [linkedin, setLinkedin] = React.useState<LinkedinAccount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const fetchAccounts = React.useCallback(async () => {
    setLoading(true);
    try {
      const [gmailRes, linkedinRes] = await Promise.all([
        fetch("/api/integrations/gmail", { cache: "no-store" }),
        fetch("/api/integrations/linkedin", { cache: "no-store" }),
      ]);
      if (gmailRes.ok) {
        const data = await gmailRes.json();
        setGmailAccounts(data.accounts ?? []);
      }
      if (linkedinRes.ok) {
        const data = await linkedinRes.json();
        setLinkedin(data.accounts ?? []);
      }
    } catch (error) {
      console.error("Failed to load integrations:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "gmail_connected") {
      setNotice({ tone: "success", message: "Gmail connected. You can send outreach now." });
    } else if (params.get("success") === "linkedin") {
      setNotice({ tone: "success", message: "LinkedIn connected." });
    } else if (params.get("error")) {
      setNotice({
        tone: "error",
        message: `Connection failed: ${params.get("error")?.replace(/_/g, " ")}`,
      });
    }
  }, []);

  async function connectGmail() {
    setBusy("gmail");
    setNotice(null);
    try {
      const res = await fetch("/api/integrations/gmail", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not start Gmail OAuth");
      const url = data.authUrl ?? data.url;
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error("Gmail OAuth is not configured");
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not connect Gmail",
      });
      setBusy(null);
    }
  }

  async function disconnectGmail(accountId: string) {
    if (!confirm("Disconnect this Gmail account? Sending will stop until it is reconnected.")) {
      return;
    }
    setBusy(accountId);
    try {
      const res = await fetch(`/api/integrations/gmail?accountId=${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchAccounts();
    } catch (error) {
      console.error("Failed to disconnect Gmail:", error);
    } finally {
      setBusy(null);
    }
  }

  async function connectLinkedin() {
    setBusy("linkedin");
    setNotice(null);
    try {
      const res = await fetch("/api/integrations/linkedin", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not start LinkedIn OAuth");
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("LinkedIn OAuth is not configured");
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not connect LinkedIn",
      });
      setBusy(null);
    }
  }

  async function disconnectLinkedin(accountId: string) {
    setBusy(accountId);
    try {
      const res = await fetch(`/api/integrations/linkedin?accountId=${accountId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchAccounts();
    } catch (error) {
      console.error("Failed to disconnect LinkedIn:", error);
    } finally {
      setBusy(null);
    }
  }

  const linkedinAccount = linkedin[0];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Integrations"
        description="Connect the channels KAGE sends from. Integrations are per workspace; tokens are encrypted at rest."
      />

      {notice ? (
        <div
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            notice.tone === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {notice.tone === "success" ? (
            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          )}
          {notice.message}
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-start gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-[#ea4335]">
              <GmailGlyph className="size-4" />
            </span>
            <div>
              <CardTitle>Gmail</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Send email outreach from your own Google account.
              </p>
            </div>
          </div>
          <Badge variant={gmailAccounts.length > 0 ? "success" : "neutral"} dot>
            {loading ? "Checking" : gmailAccounts.length > 0 ? "Connected" : "Not connected"}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 className="size-3.5 animate-spin" />
              Loading accounts…
            </p>
          ) : gmailAccounts.length === 0 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line-strong bg-elevated/40 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">No inbox connected</p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Approving a message still works; sending waits for a connected inbox.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={connectGmail}
                disabled={busy === "gmail"}
              >
                {busy === "gmail" ? <Loader2 className="animate-spin" /> : <Plug />}
                Connect Gmail
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {gmailAccounts.map((account) => (
                <li
                  key={account.id}
                  className="flex flex-wrap items-center gap-3 px-4 py-3"
                >
                  <span className="flex size-8 items-center justify-center rounded-full border border-line bg-elevated text-[#ea4335]">
                    <GmailGlyph className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-foreground">
                      {account.email}
                    </p>
                    <p className="text-[11px] text-subtle">
                      {account.profile?.name ?? "Google Workspace"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectGmail(account.id)}
                    disabled={busy === account.id}
                    className="text-subtle hover:bg-danger/10 hover:text-danger"
                  >
                    {busy === account.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                    Disconnect
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {gmailAccounts.length > 0 ? (
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={connectGmail}
                disabled={busy === "gmail"}
              >
                {busy === "gmail" ? <Loader2 className="animate-spin" /> : <Mail />}
                Add another inbox
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-start gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-[#0a66c2]">
              <LinkedinGlyph className="size-4" />
            </span>
            <div>
              <CardTitle>LinkedIn</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Publish approved LinkedIn messages through the member API.
              </p>
            </div>
          </div>
          <Badge variant={linkedinAccount?.connected ? "success" : "neutral"} dot>
            {loading ? "Checking" : linkedinAccount?.connected ? "Connected" : "Not connected"}
          </Badge>
        </CardHeader>
        <CardContent>
          {linkedinAccount?.connected ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-elevated/40 px-4 py-3">
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  LinkedIn member connected
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Approved LinkedIn drafts can be published from the outreach queue.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => disconnectLinkedin(linkedinAccount.id)}
                disabled={busy === linkedinAccount.id}
                className="text-subtle hover:bg-danger/10 hover:text-danger"
              >
                {busy === linkedinAccount.id ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-line-strong bg-elevated/40 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">
                  No LinkedIn member connected
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  Connect a member profile to publish approved LinkedIn messages.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={connectLinkedin}
                disabled={busy === "linkedin"}
              >
                {busy === "linkedin" ? <Loader2 className="animate-spin" /> : <Plug />}
                Connect LinkedIn
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] leading-relaxed text-subtle">
        OAuth apps must be configured on the server (`GOOGLE_CLIENT_ID`,
        `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`). If a
        connect button reports a configuration error, those variables are missing.
      </p>
    </div>
  );
}
