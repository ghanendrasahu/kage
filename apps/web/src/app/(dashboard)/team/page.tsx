"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("SALES_REP");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const orgId = "current";
      const [membersRes, teamsRes] = await Promise.all([
        fetch(`/api/organizations/${orgId}/members`),
        fetch(`/api/organizations/${orgId}/teams`),
      ]);
      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members ?? []);
      }
      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.teams ?? []);
      }
    } catch (error) {
      console.error("Failed to fetch team data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const orgId = "current";
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      if (res.ok) {
        setShowInvite(false);
        setInviteEmail("");
        setInviteRole("SALES_REP");
        fetchData();
      }
    } catch (error) {
      console.error("Failed to invite member:", error);
    } finally {
      setInviting(false);
    }
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the organization?")) return;
    try {
      const orgId = "current";
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to remove member:", error);
    }
  }

  async function updateMemberRole(memberId: string, newRole: string) {
    try {
      const orgId = "current";
      const res = await fetch(`/api/organizations/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  }

  const ROLE_COLORS: Record<string, string> = {
    OWNER: "bg-purple-100 text-purple-800",
    ADMIN: "bg-red-100 text-red-800",
    MANAGER: "bg-blue-100 text-blue-800",
    SALES_REP: "bg-green-100 text-green-800",
    VIEWER: "bg-gray-100 text-gray-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <button
          onClick={() => setShowInvite(true)}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Invite Member
        </button>
      </div>

      {showInvite && (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow">
          <h2 className="text-lg font-medium text-gray-900">Invite Team Member</h2>
          <form onSubmit={inviteMember} className="mt-4 flex gap-4">
            <input
              type="email"
              required
              placeholder="colleague@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="SALES_REP">Sales Rep</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
              <option value="VIEWER">Viewer</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {inviting ? "Inviting..." : "Invite"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-lg font-medium text-gray-900">Members</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    No team members yet.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                          {member.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{member.user.name}</div>
                          <div className="text-sm text-gray-500">{member.user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.id, e.target.value)}
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${ROLE_COLORS[member.role] ?? "bg-gray-100 text-gray-800"}`}
                      >
                        <option value="OWNER">Owner</option>
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="SALES_REP">Sales Rep</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : "Pending"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => removeMember(member.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Teams</h2>
          <Link
            href="/team/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create Team
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.length === 0 ? (
            <div className="col-span-full rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
              No teams yet.
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                {team.description && (
                  <p className="mt-1 text-sm text-gray-500">{team.description}</p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  {team.members.length} member{team.members.length !== 1 ? "s" : ""}
                </p>
                <div className="mt-3 flex -space-x-2">
                  {team.members.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600 ring-2 ring-white"
                    >
                      {m.user.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {team.members.length > 5 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 ring-2 ring-white">
                      +{team.members.length - 5}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
