"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Building2, Loader2, Search, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

const PUBLIC_SIGNAL_STEPS = [
  { icon: Search, label: "Research the account", description: "Company signals, pains and angles." },
  { icon: User, label: "Draft the first touch", description: "Email and LinkedIn variants for review." },
  { icon: ArrowRight, label: "Approve and send", description: "A human decides what leaves the workspace." },
];

export default function NewProspectPage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    companyName: "",
    companyDomain: "",
    personName: "",
    personTitle: "",
    email: "",
    industry: "",
    companySize: "",
    location: "",
    notes: "",
  });

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: form.companyName,
          companyDomain: form.companyDomain || undefined,
          personName: form.personName,
          personTitle: form.personTitle || undefined,
          email: form.email || undefined,
          industry: form.industry || undefined,
          companySize: form.companySize || undefined,
          location: form.location || undefined,
          notes: form.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create prospect");
      }

      router.push("/prospects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/prospects"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to prospects
      </Link>

      <PageHeader
        title="Add prospect"
        description="One record per person. KAGE uses the company fields to research the account and the contact fields to personalise the draft."
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <Building2 className="size-4 text-subtle" />
              <CardTitle>Company</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" htmlFor="company-name" required className="sm:col-span-2">
                <Input
                  id="company-name"
                  required
                  value={form.companyName}
                  onChange={(event) => updateField("companyName", event.target.value)}
                  placeholder="Acme"
                />
              </Field>
              <Field label="Domain" htmlFor="company-domain" hint="Optional">
                <Input
                  id="company-domain"
                  value={form.companyDomain}
                  onChange={(event) => updateField("companyDomain", event.target.value)}
                  placeholder="acme.com"
                />
              </Field>
              <Field label="Industry" htmlFor="company-industry" hint="Optional">
                <Input
                  id="company-industry"
                  value={form.industry}
                  onChange={(event) => updateField("industry", event.target.value)}
                  placeholder="Fintech"
                />
              </Field>
              <Field label="Company size" htmlFor="company-size" hint="Optional">
                <Select
                  id="company-size"
                  value={form.companySize}
                  onChange={(event) => updateField("companySize", event.target.value)}
                >
                  <option value="">Select…</option>
                  <option value="1-10">1–10</option>
                  <option value="11-50">11–50</option>
                  <option value="51-200">51–200</option>
                  <option value="201-1000">201–1000</option>
                  <option value="1001-5000">1001–5000</option>
                  <option value="5001+">5001+</option>
                </Select>
              </Field>
              <Field label="Location" htmlFor="company-location" hint="Optional">
                <Input
                  id="company-location"
                  value={form.location}
                  onChange={(event) => updateField("location", event.target.value)}
                  placeholder="London, UK"
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <User className="size-4 text-subtle" />
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="person-name" required>
                <Input
                  id="person-name"
                  required
                  value={form.personName}
                  onChange={(event) => updateField("personName", event.target.value)}
                  placeholder="Jordan Lee"
                />
              </Field>
              <Field label="Title" htmlFor="person-title" hint="Optional">
                <Input
                  id="person-title"
                  value={form.personTitle}
                  onChange={(event) => updateField("personTitle", event.target.value)}
                  placeholder="VP Engineering"
                />
              </Field>
              <Field label="Email" htmlFor="person-email" hint="Optional" className="sm:col-span-2">
                <Input
                  id="person-email"
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="jordan@acme.com"
                />
              </Field>
              <Field
                label="Notes"
                htmlFor="person-notes"
                hint="Optional"
                className="sm:col-span-2"
              >
                <Textarea
                  id="person-notes"
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder="Why this account matters, who referred them, anything the research should know."
                />
              </Field>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : null}
              {saving ? "Creating…" : "Create prospect"}
            </Button>
          </div>
        </div>

        <aside className="lg:col-span-2">
          <Card className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle>What happens next</CardTitle>
              <p className="text-xs text-muted">
                One record, three steps, no batch-and-blast.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {PUBLIC_SIGNAL_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.label} className="flex gap-3">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-line bg-elevated text-brand">
                      <Icon className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-foreground">
                        <span className="mr-1.5 font-mono text-[10px] text-subtle">
                          0{index + 1}
                        </span>
                        {step.label}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-lg border border-line bg-elevated/50 px-3 py-2.5 text-[11px] leading-relaxed text-subtle">
                Tip: adding a domain makes research materially better — the worker
                can pull the right public pages.
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </div>
  );
}
