"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Check, CreditCard, Gauge, Sparkles } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";

interface Plan {
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  highlight?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Starter",
    price: "$49",
    cadence: "/mo",
    description: "For a single founder running a focused outbound motion.",
    features: [
      "100 prospects",
      "50 research reports",
      "25 outreach messages",
      "1 workspace member",
    ],
  },
  {
    name: "Growth",
    price: "$149",
    cadence: "/mo",
    description: "For a small team sharing research and a review queue.",
    features: [
      "500 prospects",
      "250 research reports",
      "150 outreach messages",
      "3 workspace members",
      "Campaign performance",
    ],
    highlight: true,
  },
  {
    name: "Scale",
    price: "$399",
    cadence: "/mo",
    description: "For teams running several offers across regions.",
    features: [
      "Unlimited prospects",
      "Unlimited research",
      "Unlimited outreach",
      "Unlimited members",
      "Audit log export",
    ],
  },
];

interface Usage {
  totalProspects: number;
  totalMessages: number;
  totalResearch: number;
  totalCampaigns: number;
}

export default function BillingPage() {
  const [usage, setUsage] = React.useState<Usage | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/analytics", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active) setUsage(data.overview ?? null);
        }
      } catch (error) {
        console.error("Failed to load usage:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Billing"
        description="Plan, usage and invoices. Billing is not connected in this deployment, so plans below are informational."
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg border border-brand/25 bg-brand-soft text-brand">
              <CreditCard className="size-4" />
            </span>
            <div>
              <CardTitle>Current plan</CardTitle>
              <p className="mt-0.5 text-xs text-muted">No payment method on file.</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-strong">
            <Sparkles className="size-3" />
            Preview workspace
          </span>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-elevated/40 px-4 py-3">
            <p className="text-[11px] text-subtle">Included while in preview</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              All core features, no card required
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              Research, drafting, approvals and the audit trail are fully available.
              Connect Stripe before enabling paid plans.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-elevated/40 px-4 py-3">
            <p className="text-[11px] text-subtle">Need a paid plan?</p>
            <p className="mt-1 text-[13px] font-medium text-foreground">
              Talk to the team
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              We will wire the subscription and send a checkout link manually.
            </p>
            <a
              href="mailto:hello@kage.dev?subject=KAGE%20plan%20enquiry"
              className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-brand hover:text-brand-strong"
            >
              hello@kage.dev
              <ArrowUpRight className="size-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex flex-col rounded-card border bg-surface p-5 shadow-card ${
              plan.highlight ? "border-brand/40" : "border-line"
            }`}
          >
            {plan.highlight ? (
              <span className="absolute -top-2.5 left-5 rounded-full border border-brand/30 bg-brand-soft px-2 py-0.5 text-[10px] font-medium text-brand-strong">
                Most popular
              </span>
            ) : null}

            <h2 className="text-[13px] font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 min-h-[2.5rem] text-[11px] leading-relaxed text-muted">
              {plan.description}
            </p>
            <p className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-semibold tracking-[-0.02em] text-foreground">
                {plan.price}
              </span>
              <span className="text-[11px] text-subtle">{plan.cadence}</span>
            </p>

            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[12px] text-muted">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href={`mailto:hello@kage.dev?subject=KAGE%20${encodeURIComponent(plan.name)}%20plan`}
              className={buttonVariants({
                variant: plan.highlight ? "primary" : "secondary",
                size: "sm",
                className: "mt-5 w-full",
              })}
            >
              Talk to sales
            </a>
          </article>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Gauge className="size-4 text-subtle" />
            <CardTitle>Usage snapshot</CardTitle>
          </div>
          <Link
            href="/dashboard"
            className="text-[11px] font-medium text-muted transition-colors hover:text-foreground"
          >
            View dashboard →
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: "Prospects", value: usage?.totalProspects ?? 0 },
                { label: "Research reports", value: usage?.totalResearch ?? 0 },
                { label: "Messages", value: usage?.totalMessages ?? 0 },
                { label: "Campaigns", value: usage?.totalCampaigns ?? 0 },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-line bg-elevated/40 px-3 py-2.5"
                >
                  <p className="text-[10px] uppercase tracking-[0.1em] text-subtle">
                    {item.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                    {item.value.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <p className="text-[11px] text-subtle">
              Invoices and receipts are not generated while billing is disconnected.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                window.open(
                  "mailto:hello@kage.dev?subject=KAGE%20invoice%20request",
                  "_blank"
                )
              }
            >
              Request an invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
