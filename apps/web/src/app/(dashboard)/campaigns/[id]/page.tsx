"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  Check,
  Loader2,
  Pause,
  Play,
  Plus,
  Send,
  Target,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

import { formatDate } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { Field, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableWrap,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  status: string;
  product_service: string | null;
  icp_description: string | null;
  sales_context: string | null;
  created_at: string;
  updated_at: string;
}

interface CampaignProspect {
  id: string;
  status: string;
  created_at: string;
  prospect: {
    id: string;
    person_name: string;
    person_title: string | null;
    company_name: string;
    email: string | null;
    status: string;
  };
}

interface ProspectOption {
  id: string;
  person_name: string;
  company_name: string;
}

const CLOSED_STATUSES = new Set(["CLOSED", "DISQUALIFIED"]);

export default function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const router = useRouter();

  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [prospects, setProspects] = React.useState<CampaignProspect[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [updating, setUpdating] = React.useState(false);
  const [removing, setRemoving] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  const [addOpen, setAddOpen] = React.useState(false);
  const [options, setOptions] = React.useState<ProspectOption[]>([]);
  const [optionsLoading, setOptionsLoading] = React.useState(false);
  const [selectedProspect, setSelectedProspect] = React.useState("");
  const [adding, setAdding] = React.useState(false);

  const fetchData = React.useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${id}`, { cache: "no-store" });
      if (!res.ok) {
        if (res.status === 404) setNotFound(true);
        return;
      }
      const data = await res.json();
      setCampaign(data.campaign);
      setProspects(data.prospects ?? []);
    } catch (error) {
      console.error("Failed to fetch campaign:", error);
      setNotice({ tone: "error", message: "Could not load this campaign." });
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function openAddProspect() {
    setAddOpen(true);
    setSelectedProspect("");
    setOptionsLoading(true);
    try {
      const res = await fetch("/api/prospects?limit=100", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const inCampaign = new Set(prospects.map((row) => row.prospect.id));
        setOptions(
          (data.prospects ?? []).filter(
            (prospect: ProspectOption) => !inCampaign.has(prospect.id)
          )
        );
      }
    } catch (error) {
      console.error("Failed to load prospects:", error);
    } finally {
      setOptionsLoading(false);
    }
  }

  async function addProspect(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedProspect) return;
    setAdding(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: selectedProspect }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not add the prospect");
      }
      setAddOpen(false);
      setSelectedProspect("");
      await fetchData();
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not add prospect",
      });
    } finally {
      setAdding(false);
    }
  }

  async function updateStatus(status: string) {
    setUpdating(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not update the campaign");
      }
      await fetchData();
    } catch (error) {
      setNotice({
        tone: "error",
        message: error instanceof Error ? error.message : "Could not update campaign",
      });
    } finally {
      setUpdating(false);
    }
  }

  async function removeProspect(prospectId: string, name: string) {
    if (!confirm(`Remove ${name} from this campaign?`)) return;
    setRemoving(prospectId);
    setNotice(null);
    try {
      const res = await fetch(`/api/campaigns/${id}/prospects/${prospectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove the prospect");
      await fetchData();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error ? error.message : "Could not remove prospect",
      });
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-3 w-32" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-card lg:col-span-2" />
          <Skeleton className="h-64 rounded-card" />
        </div>
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <EmptyState
        icon={<Target />}
        title="Campaign not found"
        description="This campaign may have been deleted, or it belongs to another workspace."
        action={
          <Link
            href="/campaigns"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Back to campaigns
          </Link>
        }
      />
    );
  }

  const inPipeline = prospects.filter(
    (row) => !CLOSED_STATUSES.has(row.prospect.status)
  ).length;
  const contacted = prospects.filter((row) =>
    ["SENT", "REPLIED", "MEETING"].includes(row.prospect.status)
  ).length;

  return (
    <div className="space-y-5">
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to campaigns
      </Link>

      <PageHeader
        title={campaign.name}
        description={
          campaign.description ??
          "A campaign groups the accounts and copy for one offer."
        }
        actions={
          <>
            <Badge variant={statusVariant(campaign.status)} dot>
              {humanizeStatus(campaign.status)}
            </Badge>
            {campaign.status === "ACTIVE" ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => updateStatus("PAUSED")}
                disabled={updating}
              >
                {updating ? <Loader2 className="animate-spin" /> : <Pause />}
                Pause
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => updateStatus("ACTIVE")}
                disabled={updating || campaign.status === "COMPLETED"}
              >
                {updating ? <Loader2 className="animate-spin" /> : <Play />}
                Activate
              </Button>
            )}
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Prospects", value: prospects.length, icon: Users },
          { label: "In pipeline", value: inPipeline, icon: Target },
          { label: "Contacted", value: contacted, icon: Send },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-card border border-line bg-surface px-4 py-3"
            >
              <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-elevated text-subtle">
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">
                  {stat.label}
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Prospects</CardTitle>
                <p className="mt-0.5 text-[11px] text-subtle">
                  {prospects.length === 0
                    ? "No accounts attached yet"
                    : `${prospects.length} account${prospects.length === 1 ? "" : "s"} in this campaign`}
                </p>
              </div>
              <Button variant="primary" size="sm" onClick={openAddProspect}>
                <UserPlus />
                Add prospect
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {prospects.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    variant="compact"
                    icon={<Users />}
                    title="No prospects in this campaign"
                    description="Attach the accounts you want to work. Research and outreach then follow the campaign's offer and ICP."
                    className="border-0 bg-transparent"
                    action={
                      <Button variant="primary" size="sm" onClick={openAddProspect}>
                        <Plus />
                        Add your first prospect
                      </Button>
                    }
                  />
                </div>
              ) : (
                <TableWrap className="rounded-none border-0 shadow-none">
                  <Table>
                    <THead>
                      <TR className="hover:bg-transparent">
                        <TH>Contact</TH>
                        <TH className="hidden sm:table-cell">Company</TH>
                        <TH>Status</TH>
                        <TH className="text-right">Actions</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {prospects.map((row) => {
                        const busy = removing === row.prospect.id;
                        return (
                          <TR key={row.id}>
                            <TD>
                              <div className="flex items-center gap-2.5">
                                <Avatar name={row.prospect.person_name} size="sm" />
                                <div className="min-w-0">
                                  <Link
                                    href={`/prospects/${row.prospect.id}`}
                                    className="block truncate text-[13px] font-medium text-foreground transition-colors hover:text-brand"
                                  >
                                    {row.prospect.person_name}
                                  </Link>
                                  <p className="truncate text-[11px] text-subtle">
                                    {row.prospect.person_title ?? row.prospect.email ?? "—"}
                                  </p>
                                </div>
                              </div>
                            </TD>
                            <TD className="hidden sm:table-cell">
                              <span className="text-[12px] text-muted">
                                {row.prospect.company_name}
                              </span>
                            </TD>
                            <TD>
                              <Badge variant={statusVariant(row.prospect.status)} dot>
                                {humanizeStatus(row.prospect.status)}
                              </Badge>
                            </TD>
                            <TD>
                              <div className="flex items-center justify-end gap-1">
                                <Link
                                  href={`/prospects/${row.prospect.id}`}
                                  className="rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-hover hover:text-foreground"
                                >
                                  Open
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={() =>
                                    removeProspect(row.prospect.id, row.prospect.person_name)
                                  }
                                  disabled={busy}
                                  aria-label={`Remove ${row.prospect.person_name}`}
                                  className="text-subtle hover:bg-danger/10 hover:text-danger"
                                >
                                  {busy ? (
                                    <Loader2 className="animate-spin" />
                                  ) : (
                                    <Trash2 />
                                  )}
                                </Button>
                              </div>
                            </TD>
                          </TR>
                        );
                      })}
                    </TBody>
                  </Table>
                </TableWrap>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Briefcase className="size-4 text-subtle" />
              <CardTitle>Campaign context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContextBlock
                icon={<Briefcase />}
                label="Product / service"
                value={campaign.product_service}
              />
              <ContextBlock
                icon={<Target />}
                label="Ideal customer profile"
                value={campaign.icp_description}
              />
              <ContextBlock
                icon={<Send />}
                label="Sales context"
                value={campaign.sales_context}
              />
              <div className="flex items-center justify-between border-t border-line pt-3 text-[11px] text-subtle">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  Created {formatDate(campaign.created_at)}
                </span>
                <span>Updated {formatDate(campaign.updated_at)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
              <p className="text-[11px] text-muted">
                Research the accounts, then generate outreach.
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href="/research"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "w-full justify-start",
                })}
              >
                <Check />
                Run research
              </Link>
              <Link
                href="/outreach"
                className={buttonVariants({
                  variant: "secondary",
                  size: "sm",
                  className: "w-full justify-start",
                })}
              >
                <Send />
                Review outreach
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => router.push("/prospects/new")}
              >
                <Plus />
                Create a new prospect
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add prospects"
        description="Choose an existing prospect. Accounts already in this campaign are hidden."
      >
        {optionsLoading ? (
          <p className="flex items-center gap-2 py-4 text-sm text-muted">
            <Loader2 className="size-4 animate-spin" />
            Loading prospects…
          </p>
        ) : options.length === 0 ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-dashed border-line-strong bg-elevated/40 px-4 py-5 text-center">
              <p className="text-[13px] font-medium text-foreground">
                No prospects left to add
              </p>
              <p className="mt-0.5 text-[11px] text-muted">
                Every prospect in this workspace is already in the campaign.
              </p>
            </div>
            <div className="flex justify-end">
              <Link
                href="/prospects/new"
                className={buttonVariants({ variant: "primary", size: "sm" })}
              >
                <Plus />
                Create a prospect
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={addProspect} className="space-y-4">
            <Field label="Prospect" htmlFor="campaign-prospect" required>
              <Select
                id="campaign-prospect"
                value={selectedProspect}
                onChange={(event) => setSelectedProspect(event.target.value)}
                required
              >
                <option value="">Choose a prospect…</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.person_name} · {option.company_name}
                  </option>
                ))}
              </Select>
            </Field>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={adding || !selectedProspect}
              >
                {adding ? <Loader2 className="animate-spin" /> : <UserPlus />}
                {adding ? "Adding…" : "Add to campaign"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function ContextBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-subtle [&_svg]:size-3">
        {icon}
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
        {value?.trim() ? value : "Not set for this campaign."}
      </p>
    </div>
  );
}
