"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input, Select, Textarea } from "@/components/ui/input";

const VARIABLES = [
  "company_name",
  "person_name",
  "person_title",
  "industry",
  "product_service",
  "pain_point",
  "trigger_event",
  "sender_name",
  "sender_company",
];

const SAMPLE: Record<string, string> = {
  company_name: "Acme",
  person_name: "Jordan",
  person_title: "VP Engineering",
  industry: "fintech",
  product_service: "KAGE",
  pain_point: "manual outbound",
  trigger_event: "your Series B",
  sender_name: "Ada",
  sender_company: "KAGE",
};

function preview(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_match, variable: string) => {
    return SAMPLE[variable] ?? `{{${variable}}}`;
  });
}

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    channel: "EMAIL",
    subject: "",
    body: "",
  });

  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const token = `{{${variable}}}`;
    const node = bodyRef.current;

    if (!node) {
      setForm((current) => ({ ...current, body: `${current.body} ${token}` }));
      return;
    }

    const start = node.selectionStart ?? form.body.length;
    const end = node.selectionEnd ?? form.body.length;
    const nextBody = `${form.body.slice(0, start)}${token}${form.body.slice(end)}`;
    setForm((current) => ({ ...current, body: nextBody }));

    requestAnimationFrame(() => {
      node.focus();
      const cursor = start + token.length;
      node.setSelectionRange(cursor, cursor);
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          channel: form.channel,
          subject: form.channel === "EMAIL" ? form.subject || undefined : undefined,
          body: form.body,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create template");
      }

      router.push("/templates");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <Link
        href="/templates"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to templates
      </Link>

      <PageHeader
        title="New template"
        description="Write once, reuse across campaigns. Variables are filled from the prospect and research record at generation time."
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Template details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Template name" htmlFor="template-name" required>
                <Input
                  id="template-name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Series B — engineering leader touch"
                />
              </Field>

              <Field label="Channel" htmlFor="template-channel">
                <Select
                  id="template-channel"
                  value={form.channel}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, channel: event.target.value }))
                  }
                >
                  <option value="EMAIL">Email</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </Select>
              </Field>

              {form.channel === "EMAIL" ? (
                <Field label="Subject line" htmlFor="template-subject" hint="Optional">
                  <Input
                    id="template-subject"
                    value={form.subject}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, subject: event.target.value }))
                    }
                    placeholder="Quick question about {{company_name}}"
                  />
                </Field>
              ) : null}

              <Field label="Body" htmlFor="template-body" required>
                <Textarea
                  id="template-body"
                  ref={bodyRef}
                  required
                  rows={12}
                  value={form.body}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, body: event.target.value }))
                  }
                  placeholder={"Hi {{person_name}},\n\nI noticed {{trigger_event}} at {{company_name}}…"}
                  className="font-mono text-[12.5px] leading-relaxed"
                />
              </Field>

              <div>
                <p className="mb-2 text-xs font-medium text-muted">Insert variable</p>
                <div className="flex flex-wrap gap-1.5">
                  {VARIABLES.map((variable) => (
                    <button
                      key={variable}
                      type="button"
                      onClick={() => insertVariable(variable)}
                      className="rounded-md border border-line bg-elevated px-2 py-1 font-mono text-[10.5px] text-muted transition-colors hover:border-brand/40 hover:text-brand"
                    >
                      {`{{${variable}}}`}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {saving ? "Creating…" : "Create template"}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="lg:sticky lg:top-20">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Live preview</CardTitle>
              <span className="text-[10px] uppercase tracking-[0.1em] text-subtle">
                sample data
              </span>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-line bg-background p-4">
                {form.channel === "EMAIL" && form.subject ? (
                  <p className="border-b border-line pb-2 text-[12px] font-medium text-foreground">
                    {preview(form.subject)}
                  </p>
                ) : null}
                <p className="mt-2 whitespace-pre-wrap text-[12px] leading-relaxed text-muted">
                  {form.body
                    ? preview(form.body)
                    : "Your message will appear here as you type."}
                </p>
              </div>
              <p className="mt-3 text-[11px] leading-relaxed text-subtle">
                Unknown variables are left in place so you can spot a typo before it
                reaches a prospect.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
