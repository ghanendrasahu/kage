"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input, Textarea } from "@/components/ui/input";

export default function NewTeamPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const orgId = session?.user?.organizationId;

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", description: "" });

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) {
      setError("No organization found for this session. Refresh and try again.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not create the team");
      }

      router.push("/team");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the team");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-subtle transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to team
      </Link>

      <PageHeader
        title="Create team"
        description="Group members around a pod, a region, or a campaign. You can add members from the team page after creating it."
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-lg border border-brand/25 bg-brand-soft text-brand">
                <UsersRound className="size-4" />
              </span>
              <div>
                <p className="text-[13px] font-medium text-foreground">Team details</p>
                <p className="text-[11px] text-subtle">A name is enough to start.</p>
              </div>
            </div>

            <Field label="Team name" htmlFor="team-name" required>
              <Input
                id="team-name"
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Enterprise — EMEA"
              />
            </Field>

            <Field label="Description" htmlFor="team-description" hint="Optional">
              <Textarea
                id="team-description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Who this team covers and what they own."
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving || !orgId}>
                {saving ? <Loader2 className="animate-spin" /> : <UsersRound />}
                {saving ? "Creating…" : "Create team"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
