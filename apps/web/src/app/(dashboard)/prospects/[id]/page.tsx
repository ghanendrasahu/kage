"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { formatDate, initials, timeAgo } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { summarizeResearch } from "@/lib/research";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/input";

interface Prospect {
  id: string;
  company_name: string;
  company_domain: string | null;
  company_linkedin_url: string | null;
  person_name: string;
  person_title: string | null;
  person_linkedin_url: string | null;
  email: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface ResearchReport {
  id: string;
  summary: string | null;
  status: string;
  confidence: number | null;
  created_at: string;
}

interface OutreachMessage {
  id: string;
  channel: string;
  subject: string | null;
  body: string;
  status: string;
}

interface OutreachPackage {
  id: string;
  status: string;
  opportunity_score: number | null;
  created_at: string;
  messages: OutreachMessage[];
}

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [prospect, setProspect] = React.useState<Prospect | null>(null);
  const [reports, setReports] = React.useState<ResearchReport[]>([]);
  const [packages, setPackages] = React.useState<OutreachPackage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  const [editing, setEditing] = React.useState(false);
  const [notes, setNotes] = React.useState("");
  const [savingNotes, setSavingNotes] = React.useState(false);

  const [researching, setResearching] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [notice, setNotice] = React.useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const fetchData = React.useCallback(async () => {
    try {
      const [prospectRes, researchRes, outreachRes] = await Promise.all([
        fetch(`/api/prospects/${id}`, { cache: "no-store" }),
        fetch(`/api/research?prospectId=${id}`, { cache: "no-store" }),
        fetch(`/api/outreach?prospectId=${id}`, { cache: "no-store" }),
      ]);

      if (!prospectRes.ok) {
        if (prospectRes.status === 404) setNotFound(true);
        return;
      }

      const prospectData = await prospectRes.json();
      setProspect(prospectData.prospect);
      setNotes(prospectData.prospect.notes ?? "");

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
      setNotice({ tone: "error", message: "Could not load this prospect." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function saveNotes() {
    if (!prospect) return;
    setSavingNotes(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/prospects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Could not save notes");
      setProspect((current) => (current ? { ...current, notes } : current));
      setEditing(false);
      setNotice({ tone: "success", message: "Notes saved." });
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not save notes",
      });
    } finally {
      setSavingNotes(false);
    }
  }

  async function startResearch() {
    if (!prospect) return;
    setResearching(true);
    setNotice(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          companyName: prospect.company_name,
          companyDomain: prospect.company_domain ?? undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not start research");
      }
      setNotice({
        tone: "success",
        message: "Research queued. The report will appear here when it finishes.",
      });
      await fetchData();
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not start research",
      });
    } finally {
      setResearching(false);
    }
  }

  async function deleteProspect() {
    if (!prospect) return;
    if (!confirm(`Delete ${prospect.person_name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/prospects");
        return;
      }
      throw new Error("Could not delete the prospect");
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not delete prospect",
      });
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-3 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-44 w-full rounded-card" />
            <Skeleton className="h-40 w-full rounded-card" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-56 w-full rounded-card" />
            <Skeleton className="h-40 w-full rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !prospect) {
    return (
      <EmptyState
        icon={<Users />}
        title="Prospect not found"
        description="This record may have been deleted, or it belongs to another workspace."
        action={
          <Link
            href="/prospects"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Back to prospects
          </Link>
        }
      />
    );
  }

  const messages = packages.flatMap((pkg) => pkg.messages);
  const drafts = messages.filter((message) => message.status === "DRAFT").length;
  const approved = messages.filter((message) => message.status === "APPROVED").length;
  const latestReport = reports[0];

  return (
    <div className="space-y-5">
      <Link
        href="/prospects"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to prospects
      </Link>

      <PageHeader
        title={prospect.person_name}
        description={
          prospect.person_title
            ? `${prospect.person_title} at ${prospect.company_name}`
            : prospect.company_name
        }
        actions={
          <>
            <Badge variant={statusVariant(prospect.status)} dot>
              {humanizeStatus(prospect.status)}
            </Badge>
            <Button
              variant="primary"
              size="sm"
              onClick={startResearch}
              disabled={researching}
            >
              {researching ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {researching ? "Starting…" : "Run research"}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={deleteProspect}
              disabled={deleting}
              aria-label="Delete prospect"
              className="text-subtle hover:bg-danger/10 hover:text-danger"
            >
              {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            </Button>
          </>
        }
      />

      {notice ? (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            notice.tone === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <span className="flex size-8 items-center justify-center rounded-lg border border-brand/25 bg-brand-soft text-brand">
                <Avatar name={prospect.person_name} size="xs" className="border-0 bg-transparent text-brand-strong" />
              </span>
              <div>
                <CardTitle>Contact</CardTitle>
                <p className="mt-0.5 text-[11px] text-subtle">
                  How to reach this person.
                </p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <DetailRow icon={<Mail />} label="Email">
                {prospect.email ? (
                  <a
                    href={`mailto:${prospect.email}`}
                    className="text-brand transition-colors hover:text-brand-strong"
                  >
                    {prospect.email}
                  </a>
                ) : (
                  "Not provided"
                )}
              </DetailRow>
              <DetailRow icon={<Briefcase />} label="Title">
                {prospect.person_title ?? "Not provided"}
              </DetailRow>
              <DetailRow icon={<MapPin />} label="Location">
                {prospect.location ?? "Not provided"}
              </DetailRow>
              <DetailRow icon={<CalendarDays />} label="Added">
                {formatDate(prospect.created_at)}
              </DetailRow>
              {prospect.person_linkedin_url ? (
                <DetailRow icon={<ExternalLink />} label="LinkedIn">
                  <a
                    href={prospect.person_linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand transition-colors hover:text-brand-strong"
                  >
                    Open profile
                  </a>
                </DetailRow>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Notes</CardTitle>
                <p className="mt-0.5 text-[11px] text-subtle">
                  Context the research and drafting steps should know about.
                </p>
              </div>
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(false);
                      setNotes(prospect.notes ?? "");
                    }}
                    disabled={savingNotes}
                  >
                    <X />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? <Loader2 className="animate-spin" /> : null}
                    {savingNotes ? "Saving…" : "Save notes"}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(true)}
                >
                  <Pencil />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={5}
                  placeholder="Why this account matters, who referred them, anything useful for the first touch."
                  aria-label="Prospect notes"
                />
              ) : (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
                  {prospect.notes?.trim()
                    ? prospect.notes
                    : "No notes yet. Add context before the first draft."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Research</CardTitle>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {reports.length === 0
                    ? "No briefs yet"
                    : `${reports.length} report${reports.length === 1 ? "" : "s"} for this account`}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={startResearch}
                disabled={researching}
              >
                {researching ? <Loader2 className="animate-spin" /> : <Sparkles />}
                New report
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {reports.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    variant="compact"
                    icon={<Sparkles />}
                    title="No research yet"
                    description="Run research to collect public signals, likely pains and angles for the first message."
                    className="border-0 bg-transparent"
                    action={
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={startResearch}
                        disabled={researching}
                      >
                        <Sparkles />
                        Run research
                      </Button>
                    }
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {reports.map((report) => (
                    <li key={report.id} className="px-5 py-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={statusVariant(report.status)} dot>
                          {humanizeStatus(report.status)}
                        </Badge>
                        {typeof report.confidence === "number" ? (
                          <span className="text-[11px] tabular-nums text-subtle">
                            {Math.round(report.confidence * 100)}% confidence
                          </span>
                        ) : null}
                        <span className="ml-auto text-[11px] text-subtle">
                          {timeAgo(report.created_at)}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-muted">
                        {summarizeResearch(report.summary) ?? "The report is still generating."}
                      </p>
                      <Link
                        href="/research"
                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-strong"
                      >
                        Open in research
                        <ExternalLink className="size-3" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Building2 className="size-4 text-subtle" />
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-[12px] font-semibold text-muted">
                  {initials(prospect.company_name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-foreground">
                    {prospect.company_name}
                  </p>
                  <p className="truncate text-[11px] text-subtle">
                    {prospect.industry ?? "Industry unknown"}
                  </p>
                </div>
              </div>

              <dl className="space-y-2.5 border-t border-line pt-3 text-[12px]">
                <MetaRow icon={<Globe />} label="Domain">
                  {prospect.company_domain ? (
                    <a
                      href={`https://${prospect.company_domain.replace(/^https?:\/\//, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:text-brand-strong"
                    >
                      {prospect.company_domain}
                      <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    "—"
                  )}
                </MetaRow>
                <MetaRow icon={<Users />} label="Company size">
                  {prospect.company_size ?? "—"}
                </MetaRow>
                <MetaRow icon={<Briefcase />} label="Industry">
                  {prospect.industry ?? "—"}
                </MetaRow>
                <MetaRow icon={<CalendarDays />} label="Updated">
                  {formatDate(prospect.updated_at)}
                </MetaRow>
                <MetaRow icon={<Send />} label="Source">
                  {prospect.source ?? "Manual"}
                </MetaRow>
              </dl>

              {prospect.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1 border-t border-line pt-3">
                  {prospect.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Outreach</CardTitle>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {messages.length === 0
                    ? "Nothing generated"
                    : `${messages.length} message${messages.length === 1 ? "" : "s"}`}
                </p>
              </div>
              <Link
                href="/outreach"
                className="text-[11px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Queue →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {packages.length === 0 ? (
                <p className="text-[12px] leading-relaxed text-muted">
                  Generate outreach once the research is ready. Drafts wait in the
                  review queue before anything sends.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-line bg-elevated/50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">
                        In review
                      </p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {drafts}
                      </p>
                    </div>
                    <div className="rounded-lg border border-line bg-elevated/50 px-3 py-2">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">
                        Approved
                      </p>
                      <p className="mt-0.5 text-base font-semibold tabular-nums text-foreground">
                        {approved}
                      </p>
                    </div>
                  </div>

                  <ul className="space-y-2">
                    {packages.slice(0, 3).map((pkg) => (
                      <li
                        key={pkg.id}
                        className="rounded-lg border border-line bg-elevated/40 px-3 py-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={statusVariant(pkg.status)} dot>
                            {humanizeStatus(pkg.status)}
                          </Badge>
                          <span className="text-[10px] text-subtle">
                            {timeAgo(pkg.created_at)}
                          </span>
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted">
                          {pkg.messages.length} message
                          {pkg.messages.length === 1 ? "" : "s"}
                          {typeof pkg.opportunity_score === "number"
                            ? ` · score ${Math.round(pkg.opportunity_score)}`
                            : ""}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          {latestReport?.status === "COMPLETED" ? (
            <div className="rounded-card border border-brand/25 bg-brand-soft/40 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-strong">
                Latest brief
              </p>
              <p className="mt-1.5 line-clamp-4 text-[12px] leading-relaxed text-muted">
                {summarizeResearch(latestReport.summary)}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-elevated text-subtle [&_svg]:size-3.5">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-subtle">
          {label}
        </p>
        <div className="mt-0.5 truncate text-[12.5px] text-foreground">{children}</div>
      </div>
    </div>
  );
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-muted [&_svg]:size-3.5 [&_svg]:text-subtle">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-foreground">{children}</dd>
    </div>
  );
}
