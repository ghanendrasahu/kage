"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.organizationId) {
      fetchOrganization();
      fetchMembers();
    }
  }, [session?.user?.organizationId]);

  async function fetchOrganization() {
    try {
      const res = await fetch(`/api/organizations/${session?.user?.organizationId}`);
      const data = await res.json();
      setOrganization(data.organization);
    } catch {
      setError("Failed to load organization");
    }
  }

  async function fetchMembers() {
    try {
      const res = await fetch(`/api/organizations/${session?.user?.organizationId}/members`);
      const data = await res.json();
      setMembers(data.members);
    } catch {
      setError("Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!session?.user) {
    return null;
  }

  const isOwner = session.user.role === "OWNER";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-8 space-y-8">
        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Organization</h2>
          {organization && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{organization.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Slug</label>
                <p className="mt-1 text-sm text-gray-900">{organization.slug}</p>
              </div>
              {organization.website && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Website</label>
                  <p className="mt-1 text-sm text-gray-900">{organization.website}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
            {(isOwner || isAdmin) && (
              <button
                onClick={() => {
                  const email = prompt("Enter email address to invite:");
                  const role = prompt("Enter role (OWNER, ADMIN, MANAGER, SALES_REP, VIEWER):");
                  if (email && role) {
                    fetch(`/api/organizations/${session?.user?.organizationId}/members`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ email, role }),
                    }).then(() => fetchMembers());
                  }
                }}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-700"
              >
                Invite Member
              </button>
            )}
          </div>
          <div className="mt-4">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500">No members</p>
            ) : (
              <div className="divide-y divide-gray-200">
                {members.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gray-200" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {member.user?.name ?? "Unknown"}
                        </p>
                        <p className="text-sm text-gray-500">{member.user?.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Your Role</h2>
          <p className="mt-2 text-sm text-gray-600">
            Current role:{" "}
            <span className="font-medium text-gray-900">{session.user.role}</span>
          </p>
        </section>
      </div>
    </div>
  );
}
