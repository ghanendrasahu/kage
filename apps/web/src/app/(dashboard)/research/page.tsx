"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  FileSearch,
  Loader2,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";

import { formatDate, timeAgo } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { parseResearchSummary, summarizeResearch } from "@/lib/research";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Field, Select } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import {
  Table,
  TableEmpty,
  TableLoading,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";

interface ResearchReport {
  id: string;
  prospect_id: string | null;
  company_name: string;
  person_name: string | null;
  summary: string | null;
  confidence: number | null;
  status: string;
  created_at: string;
}

interface ReportDetail extends ResearchReport {
  sources?: Array<{ id: string; title: string | null; url: string }>;
  findings?: Array<{ id: string; finding_type?: string; title?: string; content?: string }>;
  error?: string | null;
}

interface ProspectOption {
  id: string;
  company_name: string;
  company_domain: string | null;
  person_name: string;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PENDING", label: "In progress" },
  { value: "FAILED", label: "Failed" },
];

export default function ResearchPage() {
  const [reports, setReports] = React.useState<ResearchReport[]>([]);
  const [prospects, setProspects] = React.useState<ProspectOption[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [filter, setFilter] = React.useState("all");

  const [startOpen, setStartOpen] = React.useState(false);
  const [prospectId, setProspectId] = React.useState("");
  const [starting, setStarting] = React.useState(false);
  const [runError, setRunError] = React.useState<string | null>(null);

  const [detail, setDetail] = React.useState<ReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  const fetchReports = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filter !== "all") params.set("status", filter);
      const res = await fetch(`/api/research?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  React.useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  React.useEffect(() => {
    fetch("/api/prospects?limit=100", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProspects(data?.prospects ?? []))
      .catch(() => setProspects([]));
  }, []);

  async function startResearch(event: React.FormEvent) {
    event.preventDefault();
    const prospect = prospects.find((item) => item.id === prospectId);
    if (!prospect) {
      setRunError("Choose a prospect first.");
      return;
    }

    setStarting(true);
    setRunError(null);
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
      setStartOpen(false);
      setProspectId("");
      await fetchReports();
    } catch (error) {
      setRunError(error instanceof Error ? error.message : "Could not start research");
    } finally {
      setStarting(false);
    }
  }

  async function openDetail(report: ResearchReport) {
    setDetail({ ...report });
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/research/${report.id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setDetail({ ...report, ...data.report });
      }
    } catch (error) {
      console.error("Failed to load report:", error);
    } finally {
      setDetailLoading(false);
    }
  }

  const counts = {
    all: reports.length,
    COMPLETED: reports.filter((report) => report.status === "COMPLETED").length,
    PENDING: reports.filter((report) => report.status === "PENDING").length,
    FAILED: reports.filter((report) => report.status === "FAILED").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Research"
        description="Account briefs generated from public signals. Research feeds the outreach drafts, so it is the first place to fix weak messaging."
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setStartOpen(true);
              setRunError(null);
            }}
          >
            <Plus />
            Run research
          </Button>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={filter}
          onValueChange={(value) => {
            setFilter(value);
            setPage(1);
          }}
          items={FILTERS.map((item) => ({
            ...item,
            count: counts[item.value as keyof typeof counts],
          }))}
        />
        <p className="text-xs text-muted">
          {loading ? "Loading…" : `${reports.length} reports on this page`}
        </p>
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Account</TH>
              <TH className="hidden md:table-cell">Contact</TH>
              <TH>Status</TH>
              <TH className="hidden lg:table-cell">Confidence</TH>
              <TH className="hidden sm:table-cell">Generated</TH>
              <TH className="text-right">Report</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TableLoading colSpan={6} label="Loading research" />
            ) : reports.length === 0 ? (
              <TableEmpty colSpan={6}>
                <EmptyState
                  variant="compact"
                  icon={<FileSearch />}
                  title={filter === "all" ? "No research yet" : "No reports in this state"}
                  description={
                    filter === "all"
                      ? "Pick a prospect and run research. KAGE builds a brief with company signals and outreach angles."
                      : "Switch filters to see the rest of your research."
                  }
                  className="border-0 bg-transparent"
                  action={
                    filter === "all" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => setStartOpen(true)}
                      >
                        <Sparkles />
                        Run your first research
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setFilter("all")}>
                        View all reports
                      </Button>
                    )
                  }
                />
              </TableEmpty>
            ) : (
              reports.map((report) => (
                <TR key={report.id}>
                  <TD>
                    <p className="text-[13px] font-medium text-foreground">
                      {report.company_name}
                    </p>
                    <p className="text-[11px] text-subtle">
                      {(summarizeResearch(report.summary) ?? "No summary yet").slice(0, 72)}
                    </p>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <span className="text-[12px] text-muted">
                      {report.person_name ?? "—"}
                    </span>
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(report.status)} dot>
                      {humanizeStatus(report.status)}
                    </Badge>
                  </TD>
                  <TD className="hidden lg:table-cell">
                    {typeof report.confidence === "number" ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{
                              width: `${Math.round(Math.min(1, report.confidence) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-muted">
                          {Math.round(report.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-subtle">—</span>
                    )}
                  </TD>
                  <TD className="hidden sm:table-cell">
                    <span className="text-[12px] tabular-nums text-muted">
                      {formatDate(report.created_at)}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetail(report)}
                      >
                        <Search />
                        View
                      </Button>
                      {report.prospect_id ? (
                        <Link
                          href={`/prospects/${report.prospect_id}`}
                          className="rounded-md p-1.5 text-subtle transition-colors hover:bg-hover hover:text-foreground"
                          aria-label="Open prospect"
                        >
                          <ExternalLink className="size-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <Modal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Run research"
        description="Pick an account. Research runs in the background and the report appears in this table."
      >
        <form onSubmit={startResearch} className="space-y-4">
          {runError ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {runError}
            </div>
          ) : null}

          {prospects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line-strong bg-elevated/40 px-4 py-6 text-center">
              <p className="text-[13px] font-medium text-foreground">No prospects yet</p>
              <p className="mt-1 text-xs text-muted">
                Research starts from a person, so add a prospect first.
              </p>
              <Link
                href="/prospects/new"
                className={buttonVariants({ variant: "primary", size: "sm", className: "mt-3" })}
              >
                <Plus />
                Add prospect
              </Link>
            </div>
          ) : (
            <>
              <Field label="Prospect" htmlFor="research-prospect" required>
                <Select
                  id="research-prospect"
                  value={prospectId}
                  onChange={(event) => setProspectId(event.target.value)}
                  required
                >
                  <option value="">Choose a prospect…</option>
                  {prospects.map((prospect) => (
                    <option key={prospect.id} value={prospect.id}>
                      {prospect.person_name} · {prospect.company_name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex justify-end gap-2 border-t border-line pt-4">
                <Button variant="ghost" onClick={() => setStartOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={starting || !prospectId}>
                  {starting ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {starting ? "Starting…" : "Start research"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      <Modal
        open={detail !== null}
        onClose={() => setDetail(null)}
        title={detail?.company_name ?? "Research report"}
        description={detail ? `Generated ${timeAgo(detail.created_at)}` : undefined}
        size="lg"
      >
        {detailLoading && !detail?.summary ? (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Loading report…
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(detail?.status ?? "")} dot>
                {humanizeStatus(detail?.status ?? "")}
              </Badge>
              {typeof detail?.confidence === "number" ? (
                <Badge variant="brand">
                  {Math.round(detail.confidence * 100)}% confidence
                </Badge>
              ) : null}
              {detail?.person_name ? (
                <Badge variant="outline">{detail.person_name}</Badge>
              ) : null}
            </div>

            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle">
                Summary
              </h3>
              <ResearchSummaryBody raw={detail?.summary ?? null} />
            </section>

            {detail?.findings && detail.findings.length > 0 ? (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle">
                  Findings
                </h3>
                <ul className="mt-2 space-y-2">
                  {detail.findings.slice(0, 6).map((finding) => (
                    <li
                      key={finding.id}
                      className="rounded-lg border border-line bg-elevated/40 px-3 py-2 text-[12px] text-muted"
                    >
                      {finding.title ?? finding.finding_type ?? "Finding"}
                      {finding.content ? (
                        <span className="mt-0.5 block text-[11px] text-subtle">
                          {finding.content}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail?.sources && detail.sources.length > 0 ? (
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-subtle">
                  Sources
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {detail.sources.slice(0, 6).map((source) => (
                    <li key={source.id}>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-[12px] text-brand hover:text-brand-strong"
                      >
                        <ExternalLink className="size-3" />
                        {source.title ?? source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {detail?.prospect_id ? (
              <div className="border-t border-line pt-4">
                <Link
                  href={`/prospects/${detail.prospect_id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  Open prospect workspace
                </Link>
              </div>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}

const SUMMARY_GROUPS = [
  { key: "painPoints", label: "Pain points" },
  { key: "opportunities", label: "Opportunities" },
  { key: "personalizationAngles", label: "Personalization angles" },
] as const;

function ResearchSummaryBody({ raw }: { raw: string | null }) {
  const parsed = React.useMemo(() => parseResearchSummary(raw), [raw]);
  const hasContent =
    parsed !== null &&
    (parsed.signals.length > 0 ||
      parsed.painPoints.length > 0 ||
      parsed.opportunities.length > 0 ||
      parsed.personalizationAngles.length > 0);

  if (!parsed || !hasContent) {
    return (
      <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-muted">
        {parsed
          ? "This report has no structured findings."
          : raw ?? "No summary was produced for this report."}
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-4">
      {parsed.signals.length > 0 ? (
        <div>
          <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
            Signals
          </h4>
          <ul className="mt-1.5 space-y-1.5">
            {parsed.signals.slice(0, 4).map((signal, index) => (
              <li
                key={`${signal.title ?? signal.type ?? "signal"}-${index}`}
                className="rounded-lg border border-line bg-elevated/40 px-3 py-2"
              >
                <p className="text-[12.5px] font-medium text-foreground">
                  {signal.title ?? signal.type ?? "Signal"}
                </p>
                {signal.description ? (
                  <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">
                    {signal.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {SUMMARY_GROUPS.map((group) => {
        const items = parsed[group.key];
        if (items.length === 0) return null;

        return (
          <div key={group.key}>
            <h4 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-subtle">
              {group.label}
            </h4>
            <ul className="mt-1.5 space-y-1 text-[12px] leading-relaxed text-muted">
              {items.slice(0, 6).map((item, index) => (
                <li key={`${group.key}-${index}`} className="flex gap-2">
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-line-strong" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
