"use client";

import { useOrg } from "@/components/org-context";
import {
  Users,
  FileText,
  Settings,
  Crown,
  Shield,
  User,
  Eye,
  Copy,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

const roleConfig = {
  owner: { icon: Crown, label: "Owner", color: "text-amber-400" },
  admin: { icon: Shield, label: "Admin", color: "text-blue-400" },
  member: { icon: User, label: "Member", color: "text-emerald-400" },
  viewer: { icon: Eye, label: "Viewer", color: "text-[#5a6478]" },
};

export default function OrgOverviewPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { org, isLoading } = useOrg();
  const [copied, setCopied] = useState(false);

  const copySlug = () => {
    navigator.clipboard.writeText(slug);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-[13px] text-[#5a6478]">
            Loading organization...
          </span>
        </div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-[15px] font-semibold text-[#e8edf5] mb-2">
            Organization not found
          </div>
          <p className="text-[13px] text-[#5a6478] mb-4">
            You don't have access to this organization or it doesn't exist.
          </p>
          <Link
            href="/dashboard"
            className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const role = roleConfig[org.role as keyof typeof roleConfig] ?? roleConfig.member;
  const RoleIcon = role.icon;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
            {org.name}
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={copySlug}
              className="flex items-center gap-1.5 text-[12px] text-[#5a6478] hover:text-[#e8edf5] transition-colors font-mono group"
            >
              /{org.slug}
              {copied ? (
                <CheckCircle2 size={11} className="text-emerald-400" />
              ) : (
                <Copy
                  size={11}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.09]">
          <RoleIcon size={12} className={role.color} />
          <span className={`text-[11px] font-semibold ${role.color}`}>
            {role.label}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          {
            label: "Members",
            value: org.memberCount,
            icon: Users,
            accent: "blue",
            href: `/org/${slug}/members`,
          },
          {
            label: "Documents",
            value: org.documentCount,
            icon: FileText,
            accent: "emerald",
            href: `/org/${slug}/documents`,
          },
          {
            label: "Your role",
            value: role.label,
            icon: RoleIcon,
            accent: "amber",
            href: `/org/${slug}/settings`,
          },
        ].map(({ label, value, icon: Icon, accent, href }) => (
          <Link
            key={label}
            href={href}
            className="bg-[#0d1420] border border-white/[0.07] hover:border-white/[0.13] rounded-2xl p-5 transition-all duration-200 group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-medium uppercase tracking-widest text-[#5a6478]">
                {label}
              </span>
              <Icon
                size={13}
                className={
                  accent === "blue"
                    ? "text-blue-400/50"
                    : accent === "emerald"
                    ? "text-emerald-400/50"
                    : "text-amber-400/50"
                }
              />
            </div>
            <div
              className={`text-3xl font-black tracking-tight mb-1 ${
                accent === "blue"
                  ? "text-blue-400"
                  : accent === "emerald"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {value}
            </div>
          </Link>
        ))}
      </div>

      {/* Org details */}
      <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07]">
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
              label: "Your role",
              value:
                org.role === "owner"
                  ? "Owner — Full access including billing and deletion"
                  : org.role === "admin"
                  ? "Admin — Manage members, documents, and settings"
                  : org.role === "member"
                  ? "Member — Create and edit documents, invite members"
                  : "Viewer — Read-only access to documents",
            },
            {
              label: "Member since",
              value: new Date(org.joinedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start gap-4 px-5 py-3">
              <dt className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] w-24 shrink-0 pt-0.5">
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

      {/* Next steps */}
      <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Users size={14} className="text-blue-400" />
          </div>
          <span className="text-[13px] font-semibold text-[#e8edf5]">
            Invite your team
          </span>
        </div>
        <p className="text-[13px] text-[#5a6478] leading-relaxed mb-4">
          Easily invite your colleagues to collaborate on documents and projects. You can manage permissions and roles to control access and ensure everyone has the right level of access.
        </p>
        <Link
          href={`/org/${slug}/members`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[13px] font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
        >
          <Users size={13} />
          View members
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}