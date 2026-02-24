// app/dashboard/shared/page.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  FileText,
  Eye,
  MessageSquare,
  Pencil,
  Building2,
  Clock,
  BarChart2,
  Sparkles,
} from "lucide-react";

function permissionsBadge(permissions: string[]) {
  if (permissions.includes("edit"))
    return {
      label: "Editor",
      icon: Pencil,
      color: "text-emerald-400",
      bg: "bg-emerald-400/10 border-emerald-400/20",
    };
  if (permissions.includes("comment"))
    return {
      label: "Commenter",
      icon: MessageSquare,
      color: "text-blue-400",
      bg: "bg-blue-400/10 border-blue-400/20",
    };
  return {
    label: "Viewer",
    icon: Eye,
    color: "text-[#5a6478]",
    bg: "bg-white/[0.05] border-white/[0.1]",
  };
}

function formatDate(ts: number) {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function SharedWithMePage() {
  const router = useRouter();
  const sharedDocs = useQuery(api.documents.listSharedWithMe);

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
          Shared with me
        </h1>
        <p className="text-[13px] text-[#5a6478]">
          {sharedDocs
            ? `${sharedDocs.length} document${sharedDocs.length !== 1 ? "s" : ""} shared with you`
            : "Documents from other organizations shared directly with you"}
        </p>
      </div>

      {sharedDocs === undefined ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : sharedDocs.length === 0 ? (
        <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl px-6 py-12 text-center">
          <FileText size={24} className="text-[#5a6478] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#e8edf5] mb-1">
            No shared documents yet
          </p>
          <p className="text-[13px] text-[#5a6478]">
            When someone shares a document from another organization with you,
            it will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sharedDocs.map((doc) => {
            const badge = permissionsBadge(doc.permissions);
            const BadgeIcon = badge.icon;

            return (
              <div
                key={doc._id}
                onClick={() =>
                  router.push(
                    `/org/${doc.organizationSlug}/documents/${doc._id}`
                  )
                }
                className="group relative bg-[#0d1420] border border-white/[0.07] rounded-2xl hover:border-white/[0.14] hover:bg-[#111827] transition-all duration-150 cursor-pointer"
              >
                {/* Document preview area */}
                <div className="h-28 px-5 pt-5 pb-3 border-b border-white/[0.05] overflow-hidden">
                  <div className="space-y-1.5 pointer-events-none select-none">
                    <div className="h-2 rounded-full bg-white/[0.07] w-3/4" />
                    <div className="h-2 rounded-full bg-white/[0.05] w-full" />
                    <div className="h-2 rounded-full bg-white/[0.05] w-5/6" />
                    <div className="h-2 rounded-full bg-white/[0.04] w-2/3" />
                    <div className="h-2 rounded-full bg-white/[0.03] w-4/5" />
                  </div>
                </div>

                {/* Document meta */}
                <div className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[13px] font-semibold text-[#e8edf5] truncate group-hover:text-white transition-colors leading-snug flex-1 min-w-0">
                      {doc.title}
                    </p>
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold shrink-0 ${badge.bg} ${badge.color}`}
                    >
                      <BadgeIcon size={9} />
                      {badge.label}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Building2 size={10} className="text-[#5a6478] shrink-0" />
                      <span className="text-[11px] text-[#5a6478] truncate">
                        {doc.organizationName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-[#5a6478] shrink-0" />
                        <span className="text-[11px] text-[#5a6478]">
                          {formatDate(doc.lastModifiedAt)}
                        </span>
                      </div>

                      <span className="text-[11px] text-[#5a6478]">
                        by {doc.sharedByName}
                      </span>

                      {doc.accessCount > 0 && (
                        <div className="flex items-center gap-1">
                          <BarChart2 size={10} className="text-[#5a6478] shrink-0" />
                          <span className="text-[11px] text-[#5a6478]">
                            {doc.accessCount} view{doc.accessCount !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {(doc as any).aiAnalysis && (
                        <div className="flex items-center gap-1">
                          <Sparkles size={9} className="text-blue-400 shrink-0" />
                          <span className="text-[11px] text-blue-400">
                            Analyzed
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}