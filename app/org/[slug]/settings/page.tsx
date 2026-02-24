// app/org/[slug]/settings/page.tsx
"use client";

import {
  Settings,
  Shield,
  Crown,
  User,
  Eye,
  LogOut,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { useOrg } from "@/components/org-context";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

type RoleInfo = {
  icon: LucideIcon;
  label: string;
  description: string;
  color: string;
};

const roleDescriptions: { [key: string]: RoleInfo } = {
  owner: {
    icon: Crown,
    label: "Owner",
    color: "text-amber-400",
    description:
      "Full control over the organization. Can manage all members, settings, billing, and delete the organization.",
  },
  admin: {
    icon: Shield,
    label: "Admin",
    color: "text-blue-400",
    description:
      "Can manage members and invitations, edit documents, and adjust settings. Cannot delete the organization.",
  },
  member: {
    icon: User,
    label: "Member",
    color: "text-emerald-400",
    description:
      "Can create and edit documents and invite new members. Cannot change other members' roles.",
  },
  viewer: {
    icon: Eye,
    label: "Viewer",
    color: "text-[#5a6478]",
    description:
      "Read-only access to all documents. Cannot make changes or invite others.",
  },
};

export default function SettingsPage() {
  const { org } = useOrg();
  const router = useRouter();
  const leaveOrganization = useMutation(api.organizations.leaveOrganization);

  const [leaveError, setLeaveError] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const handleLeave = async () => {
    if (!org) return;
    setLeaveError(null);
    try {
      await leaveOrganization({ organizationId: org._id });
      router.push("/dashboard");
    } catch (err) {
      setLeaveError(
        err instanceof Error ? err.message : "Failed to leave organization"
      );
      setConfirmLeave(false);
    }
  };

  if (!org) return null;

  const roleCfg: RoleInfo = roleDescriptions[org.role] ?? roleDescriptions.viewer;
  const RoleIcon = roleCfg.icon;

  return (
    <div className="space-y-8 pb-12 max-w-2xl">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
          Settings
        </h1>
        <p className="text-[13px] text-[#5a6478]">Managing {org.name}</p>
      </div>

      {/* Organization details */}
      <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
          <Settings size={13} className="text-[#5a6478]" />
          <span className="text-[13px] font-semibold text-[#e8edf5]">
            Organization details
          </span>
        </div>
        <dl className="divide-y divide-white/[0.05]">
          {[
            { label: "Name", value: org.name },
            { label: "Slug", value: `/${org.slug}`, mono: true },
            { label: "Convex ID", value: org._id, mono: true },
            {
              label: "Created",
              value: new Date(org.joinedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
            {
              label: "Max jobs/min",
              value: String(org.settings?.maxJobsPerMinute ?? "—"),
            },
            {
              label: "Max storage",
              value: org.settings?.maxStorageMB
                ? `${org.settings.maxStorageMB} MB`
                : "—",
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-5 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] w-28 shrink-0 pt-0.5">
                {row.label}
              </dt>
              <dd
                className={`flex-1 min-w-0 ${
                  row.mono
                    ? "font-mono text-[11px] text-[#8fa3c0] truncate"
                    : "text-[13px] text-[#e8edf5]"
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Your role */}
      <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/[0.04] border border-white/[0.07]">
            <RoleIcon size={14} className={roleCfg.color} />
          </div>
          <div>
            <div className={`text-[13px] font-semibold ${roleCfg.color}`}>
              {roleCfg.label}
            </div>
            <div className="text-[11px] text-[#5a6478]">Your current role</div>
          </div>
        </div>
        <p className="text-[13px] text-[#5a6478] leading-relaxed">
          {roleCfg.description}
        </p>
      </div>

      {/* Danger zone */}
      <div className="bg-[#0d1420] border border-red-500/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-500/20 flex items-center gap-2">
          <AlertTriangle size={13} className="text-red-400" />
          <span className="text-[13px] font-semibold text-red-400">
            Danger zone
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-[13px] font-medium text-[#e8edf5] mb-1">
                Leave organization
              </div>
              <p className="text-[12px] text-[#5a6478] leading-relaxed">
                {org.role === "owner"
                  ? "You are an owner. Transfer ownership to another member before leaving."
                  : "You will lose access to all documents and resources in this organization."}
              </p>
            </div>
            {org.role !== "owner" && (
              <button
                onClick={() => setConfirmLeave(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-500/30 text-red-400 text-[13px] font-medium hover:bg-red-500/[0.08] transition-colors shrink-0"
              >
                <LogOut size={13} />
                Leave
              </button>
            )}
          </div>

          {confirmLeave && (
            <div className="mt-4 pt-4 border-t border-white/[0.07]">
              <p className="text-[13px] text-[#5a6478] mb-3">
                Are you sure? You'll need a new invitation to rejoin.
              </p>
              {leaveError && (
                <p className="text-[12px] text-red-400 mb-3">{leaveError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleLeave}
                  className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[13px] font-semibold hover:bg-red-500/20 transition-colors"
                >
                  Yes, leave
                </button>
                <button
                  onClick={() => {
                    setConfirmLeave(false);
                    setLeaveError(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}