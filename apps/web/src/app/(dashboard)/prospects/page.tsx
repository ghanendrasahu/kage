"use client";

import * as React from "react";
import Link from "next/link";
import { Filter, Trash2, UserPlus, Users } from "lucide-react";

import { cn, formatDate, initials } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
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

const STATUSES = [
  "NEW",
  "RESEARCHING",
  "RESEARCHED",
  "DRAFTED",
  "REVIEW",
  "APPROVED",
  "SENT",
  "REPLIED",
  "MEETING",
  "CLOSED",
  "DISQUALIFIED",
];

export default function ProspectsPage() {
  const [prospects, setProspects] = React.useState<Prospect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [statusFilter, setStatusFilter] = React.useState("");
  const [deleting, setDeleting] = React.useState<string | null>(null);

  const fetchProspects = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/prospects?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      } else {
        setProspects([]);
      }
    } catch (error) {
      console.error("Failed to fetch prospects:", error);
      setProspects([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  React.useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  async function deleteProspect(id: string) {
    if (!confirm("Delete this prospect? This cannot be undone.")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (res.ok) fetchProspects();
    } catch (error) {
      console.error("Failed to delete prospect:", error);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prospects"
        description="Every person and account in your workspace, with the research and outreach state attached to them."
        actions={
          <Link href="/prospects/new" className={buttonVariants({ variant: "primary", size: "sm" })}>
            <UserPlus />
            Add prospect
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-subtle">
            <Filter className="mr-1 inline size-3.5 align-[-2px]" />
            Status
          </span>
          <Select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            aria-label="Filter prospects by status"
            className="w-44"
          >
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {humanizeStatus(status)}
              </option>
            ))}
          </Select>
        </div>

        <p className="text-xs text-muted">
          {loading ? "Loading…" : `${prospects.length} shown`}
        </p>
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Company</TH>
              <TH>Contact</TH>
              <TH className="hidden md:table-cell">Industry</TH>
              <TH>Status</TH>
              <TH className="hidden lg:table-cell">Added</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TableLoading colSpan={6} label="Loading prospects" />
            ) : prospects.length === 0 ? (
              <TableEmpty colSpan={6}>
                <EmptyState
                  variant="compact"
                  icon={<Users />}
                  title={statusFilter ? "No prospects in this state" : "No prospects yet"}
                  description={
                    statusFilter
                      ? "Try a different status filter, or add a prospect to this stage."
                      : "Add the people you want to reach. KAGE researches the account, drafts outreach, and routes it for approval."
                  }
                  className="border-0 bg-transparent"
                  action={
                    statusFilter ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setStatusFilter("");
                          setPage(1);
                        }}
                      >
                        Clear filter
                      </Button>
                    ) : (
                      <Link
                        href="/prospects/new"
                        className={buttonVariants({ variant: "primary", size: "sm" })}
                      >
                        <UserPlus />
                        Add your first prospect
                      </Link>
                    )
                  }
                />
              </TableEmpty>
            ) : (
              prospects.map((prospect) => (
                <TR key={prospect.id}>
                  <TD>
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-[11px] font-semibold text-muted">
                        {initials(prospect.company_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {prospect.company_name}
                        </p>
                        <p className="truncate text-[11px] text-subtle">
                          {prospect.company_domain ?? "—"}
                        </p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <p className="text-[13px] text-foreground">{prospect.person_name}</p>
                    <p className="truncate text-[11px] text-subtle">
                      {prospect.person_title ?? prospect.email ?? "—"}
                    </p>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <span className="text-[12px] text-muted">{prospect.industry ?? "—"}</span>
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(prospect.status)} dot>
                      {humanizeStatus(prospect.status)}
                    </Badge>
                  </TD>
                  <TD className="hidden lg:table-cell">
                    <span className="text-[12px] tabular-nums text-muted">
                      {formatDate(prospect.created_at)}
                    </span>
                  </TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/research?prospectId=${prospect.id}`}
                        className="rounded-md px-2 py-1 text-[12px] font-medium text-muted transition-colors hover:bg-hover hover:text-foreground"
                      >
                        Research
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => deleteProspect(prospect.id)}
                        disabled={deleting === prospect.id}
                        aria-label={`Delete ${prospect.person_name}`}
                        className={cn(
                          "text-subtle hover:bg-danger/10 hover:text-danger",
                          deleting === prospect.id && "opacity-50"
                        )}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
      </TableWrap>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
