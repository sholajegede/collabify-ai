// app/dashboard/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  ArrowRight,
  Users,
  CheckCircle2,
  Webhook,
  KeyRound,
  Database,
  Fingerprint,
} from "lucide-react";

export default function DashboardPage() {
  const me = useQuery(api.users.getMe);
  const orgs = useQuery(api.organizations.list);
  const createOrg = useMutation(api.organizations.create);
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const firstName = me?.givenName ?? me?.name?.split(" ")[0] ?? "there";

  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleNameChange = (value: string) => {
    setOrgName(value);
    setOrgSlug(generateSlug(value));
  };

  const handleCreate = async () => {
    if (!orgName.trim() || !orgSlug.trim()) return;
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      setError(
        "Slug can only contain lowercase letters, numbers, and hyphens."
      );
      return;
    }

    setCreating(true);
    setError(null);

    try {
      await createOrg({ name: orgName.trim(), slug: orgSlug.trim() });
      router.push(`/org/${orgSlug.trim()}`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create organization"
      );
      setCreating(false);
    }
  };

  const isLoading = me === undefined || orgs === undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-[13px] text-[#5a6478]">
            Loading your workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
          Good to have you, {firstName} 👋
        </h1>
        <p className="text-[#5a6478] text-[13px]">
          Your workspace is live. Create or enter an organization to get
          started.
        </p>
      </div>

      {/* Organizations section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-[#e8edf5]">
            Your organizations
          </h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[12px] font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <Plus size={12} />
              New organization
            </button>
          )}
        </div>

        {/* Create form */}
        {showForm && (
          <div className="bg-[#0d1420] border border-blue-500/20 rounded-2xl p-6 mb-4">
            <h3 className="text-[13px] font-semibold text-[#e8edf5] mb-4">
              Create organization
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                  Organization name
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                  URL slug
                </label>
                <div className="flex items-center bg-white/[0.04] border border-white/[0.1] rounded-xl overflow-hidden focus-within:border-blue-500/40">
                  <span className="text-[13px] text-[#5a6478] pl-4 pr-1 font-mono select-none">
                    /org/
                  </span>
                  <input
                    type="text"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value)}
                    placeholder="acme-corp"
                    className="flex-1 bg-transparent py-2.5 pr-4 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-[#5a6478] mt-1 px-1">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>
              {error && (
                <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2.5">
                  {error}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCreate}
                  disabled={creating || !orgName.trim() || !orgSlug.trim()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={13} />
                      Create organization
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setOrgName("");
                    setOrgSlug("");
                    setError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] hover:border-white/[0.2] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Org list */}
        {orgs.length === 0 && !showForm ? (
          <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-12 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center">
              <Building2 size={20} className="text-[#5a6478]" />
            </div>
            <div className="text-center">
              <div className="text-[15px] font-semibold text-[#e8edf5] mb-1">
                No organizations yet
              </div>
              <p className="text-[13px] text-[#5a6478] mb-4">
                Create your first organization to start collaborating.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-600 transition-colors mx-auto"
              >
                <Plus size={13} />
                Create organization
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {orgs.map((org) => (
              <a
                key={org._id}
                href={`/org/${org.slug}`}
                className="flex items-center gap-4 bg-[#0d1420] border border-white/[0.07] hover:border-white/[0.13] rounded-2xl p-4 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-base font-black text-white shrink-0">
                  {org.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-[#e8edf5] leading-none mb-1">
                    {org.name}
                  </div>
                  <div className="text-[11px] text-[#5a6478] font-mono">
                    /org/{org.slug}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#5a6478]">
                    <Users size={11} />
                    <span>{org.role}</span>
                  </div>
                  <ArrowRight
                    size={15}
                    className="text-[#5a6478] group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all"
                  />
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}