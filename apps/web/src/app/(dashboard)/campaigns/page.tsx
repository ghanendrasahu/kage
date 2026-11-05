"use client";

import * as React from "react";
import Link from "next/link";
import { Megaphone, Plus } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

interface Campaign {
  id: string;
  name: string;
  description: string | null;
  product_service: string | null;
  status: string;
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showCreate, setShowCreate] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", description: "", productService: "" });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchCampaigns = React.useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // The topbar CTA links here with ?new=1 so the form opens in one click.
  React.useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      setShowCreate(true);
    }
  }, []);

  function closeModal() {
    setShowCreate(false);
    setError(null);
    if (window.location.search) {
      window.history.replaceState({}, "", "/campaigns");
    }
  }

  async function createCampaign(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
          productService: form.productService || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create the campaign");
      }
      setForm({ name: "", description: "", productService: "" });
      closeModal();
      await fetchCampaigns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the campaign");
    } finally {
      setSaving(false);
    }
  }

  const active = campaigns.filter((item) => item.status === "ACTIVE").length;
  const completed = campaigns.filter((item) => item.status === "COMPLETED").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Campaigns"
        description="Group prospects around a single product or motion, then track research, approval and replies per campaign."
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus />
            New campaign
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-3 sm:max-w-md">
        {[
          { label: "Total", value: campaigns.length },
          { label: "Active", value: active },
          { label: "Completed", value: completed },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-line bg-surface px-3 py-2"
          >
            <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">{stat.label}</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div key={index} className="rounded-card border border-line bg-surface p-5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-3 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-2/3" />
              <Skeleton className="mt-5 h-5 w-20" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <EmptyState
          icon={<Megaphone />}
          title="No campaigns yet"
          description="A campaign is the container for one offer and one audience. Create your first one to start measuring replies instead of sends."
          action={
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus />
              Create your first campaign
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/${campaign.id}`}
              className="group flex flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg border border-line bg-elevated text-subtle transition-colors group-hover:text-brand">
                  <Megaphone className="size-4" />
                </div>
                <Badge variant={statusVariant(campaign.status)} dot>
                  {humanizeStatus(campaign.status)}
                </Badge>
              </div>

              <h2 className="mt-3 text-sm font-semibold text-foreground">{campaign.name}</h2>
              <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[12px] leading-relaxed text-muted">
                {campaign.description || "No description yet."}
              </p>

              {campaign.product_service ? (
                <span className="mt-3 inline-flex w-fit items-center rounded-md border border-line bg-elevated px-2 py-0.5 text-[11px] text-muted">
                  {campaign.product_service}
                </span>
              ) : null}

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-subtle">
                <span>Created {formatDate(campaign.created_at)}</span>
                <span className="inline-flex items-center gap-1 tabular-nums transition-colors group-hover:text-foreground">
                  {campaign.id.slice(0, 8)}
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal
        open={showCreate}
        onClose={closeModal}
        title="Create campaign"
        description="Name the motion and, optionally, the product it sells."
      >
        <form onSubmit={createCampaign} className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          ) : null}

          <Field label="Campaign name" htmlFor="campaign-name" required>
            <Input
              id="campaign-name"
              required
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Q4 — AI platform outreach"
            />
          </Field>

          <Field label="Product / service" htmlFor="campaign-product" hint="Optional">
            <Input
              id="campaign-product"
              value={form.productService}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, productService: event.target.value }))
              }
              placeholder="Data platform"
            />
          </Field>

          <Field label="Description" htmlFor="campaign-description" hint="Optional">
            <Textarea
              id="campaign-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Who this campaign targets and what the offer is."
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Creating…" : "Create campaign"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
