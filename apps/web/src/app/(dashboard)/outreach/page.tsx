"use client";

import * as React from "react";
import Link from "next/link";
import {
  Check,
  Inbox,
  Loader2,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  X,
} from "lucide-react";

import { cn, formatDate, initials, timeAgo } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface OutreachMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
  variant?: number | null;
}

interface OutreachPackage {
  id: string;
  prospect_id: string;
  company_name: string;
  status: string;
  created_at: string;
  messages: OutreachMessage[];
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "review", label: "Needs review" },
  { value: "approved", label: "Approved" },
  { value: "sent", label: "Sent" },
];

function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  if (channel === "LINKEDIN") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
        <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.96 1.96 0 100 3.92 1.96 1.96 0 000-3.92zM20.44 20h-3.38v-5.6c0-1.34-.02-3.06-1.87-3.06-1.87 0-2.16 1.46-2.16 2.96V20H9.65V8.5h3.25v1.57h.05c.45-.86 1.56-1.77 3.2-1.77 3.43 0 4.06 2.26 4.06 5.2V20z" />
      </svg>
    );
  }
  return <Mail className={className} />;
}

export default function OutreachPage() {
  const [packages, setPackages] = React.useState<OutreachPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [filter, setFilter] = React.useState("all");
  const [pending, setPending] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const fetchPackages = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/outreach?page=${page}&limit=20`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch outreach:", err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  React.useEffect(() => {
    fetchPackages();
  }, [fetchPackages]);

  async function review(messageId: string, action: "approve" | "reject") {
    setPending(messageId);
    setError(null);
    try {
      const res = await fetch(`/api/outreach/${messageId}/${action}`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Could not ${action} the message`);
      }
      await fetchPackages();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(null);
    }
  }

  const allMessages = packages.flatMap((pkg) => pkg.messages);
  const counts = {
    all: allMessages.length,
    review: allMessages.filter((message) => message.status === "DRAFT").length,
    approved: allMessages.filter((message) => message.status === "APPROVED").length,
    sent: allMessages.filter((message) => message.status === "SENT").length,
  };

  const filtered = packages
    .map((pkg) => ({
      ...pkg,
      messages: pkg.messages.filter((message) => {
        if (filter === "review") return message.status === "DRAFT";
        if (filter === "approved") return message.status === "APPROVED";
        if (filter === "sent") return message.status === "SENT";
        return true;
      }),
    }))
    .filter((pkg) => pkg.messages.length > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Outreach"
        description="Every generated email and LinkedIn message waits here for a human decision. Approve the good ones, reject the rest."
        actions={
          <Link
            href="/campaigns"
            className={buttonVariants({ variant: "secondary", size: "sm" })}
          >
            <Sparkles />
            Generate outreach
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={setFilter}
          items={FILTERS.map((item) => ({
            ...item,
            count: counts[item.value as keyof typeof counts],
          }))}
        />
        <p className="text-xs text-muted">
          {loading ? "Loading…" : `${allMessages.length} messages on this page`}
        </p>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {[0, 1].map((index) => (
            <div
              key={index}
              className="rounded-card border border-line bg-surface p-5"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="mt-5 h-16 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={filter === "all" ? "No outreach yet" : "Nothing in this view"}
          description={
            filter === "all"
              ? "Once a prospect has research, generate an outreach package. Drafts will queue here for review before anything is sent."
              : "Try another filter — the rest of your queue may still have messages."
          }
          action={
            filter === "all" ? (
              <Link
                href="/research"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                <Sparkles />
                Go to research
              </Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>
                View all messages
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((pkg) => (
            <article
              key={pkg.id}
              className="overflow-hidden rounded-card border border-line bg-surface shadow-card"
            >
              <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-[11px] font-semibold text-muted">
                  {initials(pkg.company_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[13px] font-semibold text-foreground">
                    {pkg.company_name}
                  </h2>
                  <p className="text-[11px] text-subtle">
                    Generated {formatDate(pkg.created_at)} · {pkg.messages.length} message
                    {pkg.messages.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Badge variant={statusVariant(pkg.status)} dot>
                  {humanizeStatus(pkg.status)}
                </Badge>
              </header>

              <ul className="divide-y divide-line">
                {pkg.messages.map((message) => {
                  const busy = pending === message.id;
                  return (
                    <li key={message.id} className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-md border border-line bg-elevated text-subtle">
                          <ChannelIcon channel={message.channel} className="size-3" />
                        </span>
                        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-subtle">
                          {message.channel}
                        </span>
                        {typeof message.variant === "number" ? (
                          <span className="rounded border border-line bg-elevated px-1 text-[10px] text-subtle">
                            v{message.variant + 1}
                          </span>
                        ) : null}
                        <Badge variant={statusVariant(message.status)} dot className="ml-auto">
                          {humanizeStatus(message.status)}
                        </Badge>
                      </div>

                      {message.subject ? (
                        <p className="mt-2.5 text-[13px] font-medium text-foreground">
                          {message.subject}
                        </p>
                      ) : null}
                      <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-relaxed text-muted">
                        {message.body}
                      </p>

                      {message.status === "DRAFT" ? (
                        <div className="mt-3 flex items-center gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => review(message.id, "approve")}
                            disabled={busy}
                          >
                            {busy ? <Loader2 className="animate-spin" /> : <Check />}
                            Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => review(message.id, "reject")}
                            disabled={busy}
                          >
                            <X />
                            Reject
                          </Button>
                          <span className="ml-auto hidden items-center gap-1 text-[11px] text-subtle sm:flex">
                            <MessageSquare className="size-3" />
                            Editing lives in the prospect workspace
                          </span>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              <footer className="flex items-center justify-between border-t border-line px-5 py-2.5 text-[11px] text-subtle">
                <span className="flex items-center gap-1.5">
                  <Send className="size-3" />
                  Package updated {timeAgo(pkg.created_at)}
                </span>
                <Link
                  href={`/prospects/${pkg.prospect_id}`}
                  className={cn(
                    "font-medium text-muted transition-colors hover:text-foreground"
                  )}
                >
                  Open prospect →
                </Link>
              </footer>
            </article>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        className="pt-1"
      />
    </div>
  );
}
