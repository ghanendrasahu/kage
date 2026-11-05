"use client";

import * as React from "react";
import { Download, Filter, ScrollText } from "lucide-react";

import { formatDateTime } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface AuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

// Must mirror the AuditAction enum. Unknown values are rejected by Postgres.
const ACTIONS = [
  "CREATE",
  "READ",
  "UPDATE",
  "DELETE",
  "APPROVE",
  "REJECT",
  "SEND",
  "LOGIN",
  "LOGOUT",
  "CONNECT",
  "DISCONNECT",
];

const RESOURCES = [
  "PROSPECT",
  "RESEARCH_REPORT",
  "OUTREACH_PACKAGE",
  "EMAIL_MESSAGE",
  "CAMPAIGN",
  "USER",
  "INTEGRATION",
];

export default function AuditPage() {
  const [logs, setLogs] = React.useState<AuditLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [actionFilter, setActionFilter] = React.useState("");
  const [resourceFilter, setResourceFilter] = React.useState("");

  const fetchLogs = React.useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (actionFilter) params.set("action", actionFilter);
      if (resourceFilter) params.set("resourceType", resourceFilter);

      const res = await fetch(`/api/audit-logs?${params}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs ?? []);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceFilter]);

  React.useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  function exportJson() {
    const blob = new Blob([JSON.stringify(logs, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kage-audit-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        description="An append-only record of who changed what. Useful when a send, approval or deletion needs a paper trail."
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={exportJson}
            disabled={logs.length === 0}
          >
            <Download />
            Export page
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-subtle">
          <Filter className="mr-1 inline size-3.5 align-[-2px]" />
          Filters
        </span>
        <Select
          value={actionFilter}
          onChange={(event) => {
            setActionFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by action"
          className="w-48"
        >
          <option value="">All actions</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {humanizeStatus(action)}
            </option>
          ))}
        </Select>
        <Select
          value={resourceFilter}
          onChange={(event) => {
            setResourceFilter(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by resource"
          className="w-48"
        >
          <option value="">All resources</option>
          {RESOURCES.map((resource) => (
            <option key={resource} value={resource}>
              {humanizeStatus(resource)}
            </option>
          ))}
        </Select>
        {(actionFilter || resourceFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setActionFilter("");
              setResourceFilter("");
              setPage(1);
            }}
          >
            Clear
          </Button>
        )}
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH className="w-44">Time</TH>
              <TH>Action</TH>
              <TH className="hidden md:table-cell">Resource</TH>
              <TH className="hidden lg:table-cell">Details</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TableLoading colSpan={4} label="Loading audit log" />
            ) : logs.length === 0 ? (
              <TableEmpty colSpan={4}>
                <EmptyState
                  variant="compact"
                  icon={<ScrollText />}
                  title="No audit entries"
                  description={
                    actionFilter || resourceFilter
                      ? "No entries match these filters. Clear them to see the full history."
                      : "Actions will appear here as your team adds prospects, runs research, and reviews outreach."
                  }
                  className="border-0 bg-transparent"
                  action={
                    actionFilter || resourceFilter ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setActionFilter("");
                          setResourceFilter("");
                          setPage(1);
                        }}
                      >
                        Clear filters
                      </Button>
                    ) : undefined
                  }
                />
              </TableEmpty>
            ) : (
              logs.map((log) => (
                <TR key={log.id}>
                  <TD>
                    <span className="whitespace-nowrap text-[11px] tabular-nums text-muted">
                      {formatDateTime(log.created_at)}
                    </span>
                  </TD>
                  <TD>
                    <Badge variant={statusVariant(log.action)}>
                      {humanizeStatus(log.action)}
                    </Badge>
                  </TD>
                  <TD className="hidden md:table-cell">
                    <span className="text-[12px] text-muted">
                      {humanizeStatus(log.resource_type)}
                    </span>
                    {log.resource_id ? (
                      <span className="ml-1.5 font-mono text-[10px] text-subtle">
                        {log.resource_id.slice(0, 8)}
                      </span>
                    ) : null}
                  </TD>
                  <TD className="hidden lg:table-cell">
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <details className="group">
                        <summary className="cursor-pointer list-none text-[11px] font-medium text-muted transition-colors hover:text-foreground">
                          View
                        </summary>
                        <pre className="mt-1.5 max-w-md overflow-x-auto rounded-md border border-line bg-elevated px-2 py-1.5 font-mono text-[10px] leading-relaxed text-subtle">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-[12px] text-subtle">—</span>
                    )}
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
