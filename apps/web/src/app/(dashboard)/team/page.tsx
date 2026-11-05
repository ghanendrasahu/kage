"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { formatDate, initials } from "@/lib/utils";
import { humanizeStatus, statusVariant } from "@/lib/status";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { Field, Input, Select as RoleSelect } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";

interface TeamMember {
  id: string;
  user: { id: string; name: string; email: string; avatar_url: string | null };
  role: string;
  joined_at: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string | null;
  members: TeamMember[];
  created_at: string;
}

const ROLES = ["OWNER", "ADMIN", "MANAGER", "SALES_REP", "VIEWER"];

export default function TeamPage() {
  const { data: session, status } = useSession();
  const orgId = session?.user?.organizationId;

  const [members, setMembers] = React.useState<TeamMember[]>([]);
  const [teams, setTeams] = React.useState<Team[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState("SALES_REP");
  const [inviting, setInviting] = React.useState(false);
  const [busyMember, setBusyMember] = React.useState<string | null>(null);

  const fetchData = React.useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [membersRes, teamsRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/members`, { cache: "no-store" }),
        fetch(`/api/organizations/${orgId}/teams`, { cache: "no-store" }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      } else {
        setError("Could not load members for this workspace.");
      }

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams ?? []);
      }
    } catch (err) {
      console.error("Failed to fetch team data:", err);
      setError("Could not load the team. Try refreshing.");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  React.useEffect(() => {
    if (status === "authenticated" && orgId) {
      fetchData();
    }
  }, [status, orgId, fetchData]);

  async function inviteMember(event: React.FormEvent) {
    event.preventDefault();
    if (!orgId) return;
    setInviting(true);
    setError(null);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not invite this person");
      }

      setInviteOpen(false);
      setInviteEmail("");
      setInviteRole("SALES_REP");
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not invite this person");
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!orgId || !confirm("Remove this member from the organization?")) return;
    setBusyMember(memberId);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error("Failed to remove member:", err);
    } finally {
      setBusyMember(null);
    }
  }

  async function updateMemberRole(memberId: string, role: string) {
    if (!orgId) return;
    setBusyMember(memberId);
    try {
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error("Failed to update role:", err);
    } finally {
      setBusyMember(null);
    }
  }

  const canInvite = ["OWNER", "ADMIN"].includes(session?.user?.role ?? "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Members, roles and teams. Roles control who can invite, approve outreach and change settings."
        actions={
          <>
            <Link
              href="/team/new"
              className={buttonVariants({ variant: "secondary", size: "sm" })}
            >
              <UsersRound />
              Create team
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setError(null);
                setInviteOpen(true);
              }}
              disabled={!canInvite}
              title={canInvite ? undefined : "Only owners and admins can invite"}
            >
              <UserPlus />
              Invite member
            </Button>
          </>
        }
      />

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Members</CardTitle>
              <p className="mt-0.5 text-xs text-muted">
                {members.length} {members.length === 1 ? "person" : "people"} in this
                workspace
              </p>
            </div>
            <ShieldCheck className="size-4 text-subtle" />
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-10 text-sm text-muted">
                <Loader2 className="size-4 animate-spin" />
                Loading members…
              </div>
            ) : members.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  variant="compact"
                  icon={<UsersRound />}
                  title="No members yet"
                  description="Invite the first teammate so they can review outreach and share the research queue."
                  className="border-0 bg-transparent"
                  action={
                    canInvite ? (
                      <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                        <UserPlus />
                        Invite a member
                      </Button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {members.map((member) => {
                  const busy = busyMember === member.id;
                  return (
                    <li
                      key={member.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3 transition-colors hover:bg-hover/40"
                    >
                      <Avatar name={member.user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium text-foreground">
                          {member.user.name}
                        </p>
                        <p className="truncate text-[11px] text-subtle">
                          {member.user.email}
                        </p>
                      </div>

                      <span className="hidden text-[11px] tabular-nums text-subtle sm:block">
                        Joined {member.joined_at ? formatDate(member.joined_at) : "pending"}
                      </span>

                      <RoleSelect
                        value={member.role}
                        onChange={(event) =>
                          updateMemberRole(member.id, event.target.value)
                        }
                        disabled={busy || member.role === "OWNER"}
                        aria-label={`Role for ${member.user.name}`}
                        className="h-8 w-36 text-xs"
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {humanizeStatus(role)}
                          </option>
                        ))}
                      </RoleSelect>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeMember(member.id)}
                        disabled={busy || member.role === "OWNER"}
                        aria-label={`Remove ${member.user.name}`}
                        className="text-subtle hover:bg-danger/10 hover:text-danger"
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Roles</CardTitle>
              <p className="mt-0.5 text-xs text-muted">What each role can do.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { role: "OWNER", can: "Everything, including billing and deletion." },
              { role: "ADMIN", can: "Team, settings, integrations and outreach." },
              { role: "MANAGER", can: "Campaigns, templates and approvals." },
              { role: "SALES_REP", can: "Prospects, research and own outreach." },
              { role: "VIEWER", can: "Read-only access to the workspace." },
            ].map((item) => (
              <div key={item.role} className="flex items-start gap-2.5">
                <Badge variant={statusVariant(item.role)} className="mt-0.5 shrink-0">
                  {humanizeStatus(item.role)}
                </Badge>
                <p className="text-[11px] leading-relaxed text-muted">{item.can}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Teams</h2>
            <p className="mt-0.5 text-xs text-muted">
              Organise members around a book of business or a campaign pod.
            </p>
          </div>
          <Link
            href="/team/new"
            className="inline-flex items-center gap-1 text-[12px] font-medium text-muted transition-colors hover:text-foreground"
          >
            <Plus className="size-3.5" />
            New team
          </Link>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                variant="compact"
                icon={<UsersRound />}
                title="No teams yet"
                description="Teams are optional. Use them when one workspace holds several pods with different books of business."
                action={
                  <Link
                    href="/team/new"
                    className={buttonVariants({ variant: "secondary", size: "sm" })}
                  >
                    <Plus />
                    Create a team
                  </Link>
                }
              />
            </div>
          ) : (
            teams.map((team) => (
              <Card key={team.id}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[13px] font-semibold text-foreground">
                        {team.name}
                      </h3>
                      {team.description ? (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
                          {team.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline">
                      {team.members.length} member{team.members.length === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="flex -space-x-2">
                    {team.members.slice(0, 6).map((member) => (
                      <Avatar
                        key={member.id}
                        name={member.user.name}
                        size="xs"
                        className="ring-2 ring-surface"
                      />
                    ))}
                    {team.members.length > 6 ? (
                      <span className="flex size-6 items-center justify-center rounded-full border border-line bg-elevated text-[10px] font-medium text-muted ring-2 ring-surface">
                        +{team.members.length - 6}
                      </span>
                    ) : null}
                  </div>

                  <p className="border-t border-line pt-3 text-[10px] text-subtle">
                    Created {formatDate(team.created_at)}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </section>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a member"
        description="They need a KAGE account first. We match the account by email."
      >
        <form onSubmit={inviteMember} className="space-y-4">
          <Field label="Email address" htmlFor="invite-email" required>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
              <Input
                id="invite-email"
                type="email"
                required
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="colleague@company.com"
                className="pl-8"
              />
            </div>
          </Field>

          <Field label="Role" htmlFor="invite-role">
            <RoleSelect
              id="invite-role"
              value={inviteRole}
              onChange={(event) => setInviteRole(event.target.value)}
            >
              <option value="SALES_REP">Sales rep</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </RoleSelect>
          </Field>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={inviting}>
              {inviting ? <Loader2 className="animate-spin" /> : <UserPlus />}
              {inviting ? "Inviting…" : "Add member"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
