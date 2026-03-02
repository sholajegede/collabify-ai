"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Share2,
  X,
  Mail,
  Trash2,
  Eye,
  MessageSquare,
  Pencil,
  Clock,
} from "lucide-react";

type Permission = "view" | "comment" | "edit";

const permissionSets: {
  value: Permission[];
  label: string;
  icon: typeof Eye;
  color: string;
}[] = [
  { value: ["view"], label: "Can view", icon: Eye, color: "text-[#5a6478]" },
  {
    value: ["view", "comment"],
    label: "Can comment",
    icon: MessageSquare,
    color: "text-blue-400",
  },
  {
    value: ["view", "comment", "edit"],
    label: "Can edit",
    icon: Pencil,
    color: "text-emerald-400",
  },
];

function permissionsToLabel(permissions: string[]): string {
  if (permissions.includes("edit")) return "Can edit";
  if (permissions.includes("comment")) return "Can comment";
  return "Can view";
}

function permissionsToColor(permissions: string[]): string {
  if (permissions.includes("edit")) return "text-emerald-400";
  if (permissions.includes("comment")) return "text-blue-400";
  return "text-[#5a6478]";
}

export function ShareDialog({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const shares = useQuery(api.documentShares.listForDocument, {
    documentId: documentId as any,
  });

  const shareDocument = useMutation(api.documentShares.share);
  const updatePermissions = useMutation(api.documentShares.updatePermissions);
  const revokeShare = useMutation(api.documentShares.revoke);

  const [email, setEmail] = useState("");
  const [selectedSet, setSelectedSet] = useState(0); // index into permissionSets
  const [expiryDays, setExpiryDays] = useState<string>("");
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleShare = async () => {
    if (!email.trim()) return;
    setSharing(true);
    setError(null);
    setSuccessMsg(null);

    const permissions = permissionSets[selectedSet].value as string[];
    const expiresAt = expiryDays
      ? Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000
      : undefined;

    try {
      const result = await shareDocument({
        documentId: documentId as any,
        email: email.trim(),
        permissions,
        expiresAt,
      });
      setEmail("");
      setExpiryDays("");
      setSuccessMsg(result.updated ? "Access updated." : "Document shared.");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to share document"
      );
    } finally {
      setSharing(false);
    }
  };

  const handleUpdatePermissions = async (
    shareId: string,
    permissions: string[]
  ) => {
    try {
      await updatePermissions({
        shareId: shareId as any,
        permissions,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update permissions"
      );
    }
  };

  const handleRevoke = async (shareId: string) => {
    try {
      await revokeShare({ shareId: shareId as any });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke access"
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#0d1420] border border-white/[0.1] rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-2">
            <Share2 size={14} className="text-blue-400" />
            <span className="text-[14px] font-semibold text-[#e8edf5]">
              Share document
            </span>
          </div>
          <button
            title="close button"
            onClick={onClose}
            className="text-[#5a6478] hover:text-[#e8edf5] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Share form */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleShare()}
                placeholder="colleague@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/40 transition-colors"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {permissionSets.map((set, i) => {
                const Icon = set.icon;
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSet(i)}
                    className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border text-[11px] font-semibold transition-colors ${
                      selectedSet === i
                        ? "border-blue-500/40 bg-blue-500/10 text-blue-400"
                        : "border-white/[0.08] bg-white/[0.02] text-[#5a6478] hover:border-white/[0.15]"
                    }`}
                  >
                    <Icon size={14} />
                    {set.label}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                Expires after (optional)
              </label>
              <select
                title="expiry days select"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] focus:outline-none focus:border-blue-500/40 transition-colors appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0d1420]">
                  Never expires
                </option>
                <option value="1" className="bg-[#0d1420]">
                  1 day
                </option>
                <option value="7" className="bg-[#0d1420]">
                  7 days
                </option>
                <option value="30" className="bg-[#0d1420]">
                  30 days
                </option>
                <option value="90" className="bg-[#0d1420]">
                  90 days
                </option>
              </select>
            </div>

            {error && (
              <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="text-[12px] text-emerald-400 bg-emerald-400/[0.08] border border-emerald-400/20 rounded-xl px-4 py-2.5">
                {successMsg}
              </div>
            )}

            <button
              onClick={handleShare}
              disabled={sharing || !email.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sharing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Mail size={13} />
                  Share
                </>
              )}
            </button>
          </div>

          {/* Existing shares list */}
          {shares && shares.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] mb-2">
                People with access
              </div>
              <div className="space-y-1">
                {shares.map((share) => (
                  <div
                    key={share._id}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-white/[0.03] group transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                      {share.sharedWithName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] font-medium text-[#e8edf5] truncate">
                        {share.sharedWithName}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#5a6478] truncate">
                          {share.sharedWithEmail}
                        </span>
                        {share.isExpired && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Clock size={9} />
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <select
                        title="permissions select"
                        value={
                          share.permissions.includes("edit")
                            ? "edit"
                            : share.permissions.includes("comment")
                            ? "comment"
                            : "view"
                        }
                        onChange={(e) => {
                          const map: Record<string, string[]> = {
                            view: ["view"],
                            comment: ["view", "comment"],
                            edit: ["view", "comment", "edit"],
                          };
                          handleUpdatePermissions(
                            share._id,
                            map[e.target.value] ?? ["view"]
                          );
                        }}
                        className={`appearance-none bg-transparent text-[11px] font-medium cursor-pointer focus:outline-none pr-3 ${permissionsToColor(share.permissions)}`}
                      >
                        <option
                          value="view"
                          className="bg-[#0d1420] text-[#e8edf5]"
                        >
                          Can view
                        </option>
                        <option
                          value="comment"
                          className="bg-[#0d1420] text-[#e8edf5]"
                        >
                          Can comment
                        </option>
                        <option
                          value="edit"
                          className="bg-[#0d1420] text-[#e8edf5]"
                        >
                          Can edit
                        </option>
                      </select>

                      <button
                        onClick={() => handleRevoke(share._id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg text-[#5a6478] hover:text-red-400 ml-1"
                        title="Revoke access"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}