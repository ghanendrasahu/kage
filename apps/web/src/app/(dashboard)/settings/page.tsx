"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CheckCircle2, Loader2, Settings2, ShieldCheck, Users } from "lucide-react";

import { formatDate } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Field, Input } from "@/components/ui/input";

interface Organization {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  created_at: string;
}

interface Member {
  id: string;
  role: string;
  joined_at: string | null;
  user: { name: string; email: string };
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const orgId = session?.user?.organizationId;

  const [organization, setOrganization] = React.useState<Organization | null>(null);
  const [members, setMembers] = React.useState<Member[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({ name: "", website: "" });

  React.useEffect(() => {
    if (!orgId) return;
    let active = true;

    async function load() {
      try {
        const [orgRes, membersRes] = await Promise.all([
          fetch(`/api/organizations/${orgId}`, { cache: "no-store" }),
          fetch(`/api/organizations/${orgId}/members`, { cache: "no-store" }),
        ]);

        if (orgRes.ok) {
          const data = await orgRes.json();
          if (!active) return;
          setOrganization(data.organization);
          setForm({
            name: data.organization.name ?? "",
            website: data.organization.website ?? "",
          });
        } else {
          setError("Could not load the organization.");
        }

        if (membersRes.ok) {
          const data = await membersRes.json();
          if (active) setMembers(data.members ?? []);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Could not load settings. Try refreshing.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [orgId]);

  async function saveOrganization(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) return;

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          website: form.website || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not save changes");
      }

      const data = await res.json();
      setOrganization(data.organization);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  const canEdit = ["OWNER", "ADMIN"].includes(session?.user?.role ?? "");

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <Loader2 className="size-4 animate-spin" />
        Loading settings…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Settings"
        description="Workspace identity, your account, and the people who share this organization."
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          <CheckCircle2 className="size-3.5" />
          Workspace settings saved.
        </div>
      ) : null}

      <form onSubmit={saveOrganization}>
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <Settings2 className="size-4 text-subtle" />
            <div>
              <CardTitle>Organization</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                Shown in the sidebar and on audit records.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Workspace name" htmlFor="org-name" required>
                <Input
                  id="org-name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  disabled={!canEdit}
                />
              </Field>
              <Field label="Website" htmlFor="org-website" hint="Must be a full URL">
                <Input
                  id="org-website"
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, website: event.target.value }))
                  }
                  placeholder="https://example.com"
                  disabled={!canEdit}
                />
              </Field>
              <Field label="Workspace slug" htmlFor="org-slug" hint="Read-only">
                <Input id="org-slug" value={organization?.slug ?? ""} readOnly disabled />
              </Field>
              <Field label="Created" htmlFor="org-created">
                <Input
                  id="org-created"
                  value={organization ? formatDate(organization.created_at) : "—"}
                  readOnly
                  disabled
                />
              </Field>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              <p className="text-[11px] text-subtle">
                {canEdit
                  ? "Owners and admins can edit these fields."
                  : "Only owners and admins can edit workspace details."}
              </p>
              <Button type="submit" variant="primary" disabled={!canEdit || saving}>
                {saving ? <Loader2 className="animate-spin" /> : null}
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <ShieldCheck className="size-4 text-subtle" />
            <CardTitle>Your account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={session?.user?.name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-foreground">
                  {session?.user?.name}
                </p>
                <p className="truncate text-[11px] text-subtle">{session?.user?.email}</p>
              </div>
            </div>
            <dl className="space-y-2 border-t border-line pt-3 text-[12px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted">Role</dt>
                <dd>
                  <Badge variant={statusVariant(session?.user?.role ?? "")}>
                    {humanizeStatus(session?.user?.role ?? "VIEWER")}
                  </Badge>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted">Session</dt>
                <dd className="text-foreground">Active</dd>
              </div>
            </dl>
            <p className="text-[11px] leading-relaxed text-subtle">
              To change your password or email, use the reset flow from the sign-in
              screen.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-subtle" />
              <CardTitle>Members</CardTitle>
            </div>
            <Link
              href="/team"
              className="text-[11px] font-medium text-muted transition-colors hover:text-foreground"
            >
              Manage →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.length === 0 ? (
              <p className="text-[12px] text-muted">No members to show.</p>
            ) : (
              members.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  <Avatar name={member.user.name} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-foreground">
                      {member.user.name}
                    </p>
                    <p className="truncate text-[10px] text-subtle">{member.user.email}</p>
                  </div>
                  <Badge variant={statusVariant(member.role)}>
                    {humanizeStatus(member.role)}
                  </Badge>
                </div>
              ))
            )}
            {members.length > 5 ? (
              <p className="border-t border-line pt-2 text-[10px] text-subtle">
                +{members.length - 5} more in Team
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
