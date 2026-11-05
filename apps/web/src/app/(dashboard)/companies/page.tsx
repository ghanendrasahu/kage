"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, Search, UserPlus, Users } from "lucide-react";

import { formatDate, initials } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

interface CompanyRow {
  company_name: string;
  company_domain: string | null;
  industry: string | null;
  company_size: string | null;
  contacts: number;
  researched: number;
  in_pipeline: number;
  last_added: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = React.useState<CompanyRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch("/api/companies", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (active) setCompanies(data.companies ?? []);
        }
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = React.useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return companies;
    return companies.filter((company) =>
      `${company.company_name} ${company.company_domain ?? ""} ${company.industry ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [companies, query]);

  const totalContacts = companies.reduce((sum, company) => sum + company.contacts, 0);
  const researched = companies.reduce((sum, company) => sum + company.researched, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Companies"
        description="Accounts assembled from your prospect list. Use this view to spot companies with several contacts or no research coverage yet."
        actions={
          <Link
            href="/prospects/new"
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            <UserPlus />
            Add contact
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Accounts", value: companies.length, icon: Building2 },
          { label: "Contacts", value: totalContacts, icon: Users },
          { label: "Researched contacts", value: researched, icon: Search },
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
                  {loading ? "—" : stat.value.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search accounts, domains, industries…"
          className="pl-8"
          aria-label="Search companies"
        />
      </div>

      <TableWrap>
        <Table>
          <THead>
            <TR className="hover:bg-transparent">
              <TH>Account</TH>
              <TH className="hidden md:table-cell">Industry</TH>
              <TH className="hidden lg:table-cell">Size</TH>
              <TH>Contacts</TH>
              <TH className="hidden sm:table-cell">Research coverage</TH>
              <TH className="hidden xl:table-cell">Last added</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TableLoading colSpan={6} label="Loading companies" />
            ) : filtered.length === 0 ? (
              <TableEmpty colSpan={6}>
                <EmptyState
                  variant="compact"
                  icon={<Building2 />}
                  title={query ? "No matching accounts" : "No companies yet"}
                  description={
                    query
                      ? "Try a shorter search, or clear the filter to see every account."
                      : "Companies appear automatically once you add prospects. Add your first contact to get started."
                  }
                  className="border-0 bg-transparent"
                  action={
                    query ? (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        className="text-[12px] font-medium text-brand hover:text-brand-strong"
                      >
                        Clear search
                      </button>
                    ) : (
                      <Link
                        href="/prospects/new"
                        className={buttonVariants({ variant: "primary", size: "sm" })}
                      >
                        <UserPlus />
                        Add your first contact
                      </Link>
                    )
                  }
                />
              </TableEmpty>
            ) : (
              filtered.map((company) => {
                const coverage =
                  company.contacts > 0
                    ? Math.round((company.researched / company.contacts) * 100)
                    : 0;

                return (
                  <TR key={company.company_name}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-[11px] font-semibold text-muted">
                          {initials(company.company_name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-medium text-foreground">
                            {company.company_name}
                          </p>
                          <p className="truncate text-[11px] text-subtle">
                            {company.company_domain ?? "No domain"}
                          </p>
                        </div>
                      </div>
                    </TD>
                    <TD className="hidden md:table-cell">
                      <span className="text-[12px] text-muted">{company.industry ?? "—"}</span>
                    </TD>
                    <TD className="hidden lg:table-cell">
                      <span className="text-[12px] text-muted">
                        {company.company_size ?? "—"}
                      </span>
                    </TD>
                    <TD>
                      <span className="inline-flex items-center gap-1.5 text-[12px] text-muted">
                        <Users className="size-3.5 text-subtle" />
                        {company.contacts}
                      </span>
                    </TD>
                    <TD className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-elevated">
                          <div
                            className="h-full rounded-full bg-brand"
                            style={{ width: `${coverage}%` }}
                          />
                        </div>
                        <span className="text-[11px] tabular-nums text-subtle">
                          {coverage}%
                        </span>
                      </div>
                    </TD>
                    <TD className="hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] tabular-nums text-muted">
                          {formatDate(company.last_added)}
                        </span>
                        {company.in_pipeline > 0 ? (
                          <Badge variant="info" dot>
                            {company.in_pipeline} in pipeline
                          </Badge>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
      </TableWrap>

      {loading ? (
        <div className="grid gap-2 sm:hidden">
          <Skeleton className="h-14 w-full" />
        </div>
      ) : null}
    </div>
  );
}
