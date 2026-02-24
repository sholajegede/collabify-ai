"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Zap, Users, CheckCircle2, XCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function InvitationAccept({ token }: { token: string }) {
  const router = useRouter();
  const invitation = useQuery(api.invitations.getByToken, { token });
  const acceptInvitation = useMutation(api.invitations.accept);

  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    setAccepting(true);
    setError(null);
    try {
      const result = await acceptInvitation({ token });
      if (result.success && result.organizationSlug) {
        router.push(`/org/${result.organizationSlug}`);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
      setAccepting(false);
    }
  };

  if (invitation === undefined) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <InviteShell>
        <XCircle size={32} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-[22px] font-black text-[#e8edf5] mb-2">
          Invitation not found
        </h1>
        <p className="text-[13px] text-[#5a6478] mb-6">
          This link is invalid or has already been removed.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[13px] text-[#e8edf5] hover:bg-white/[0.1] transition-colors"
        >
          Go to dashboard
        </Link>
      </InviteShell>
    );
  }

  if (invitation.status === "expired") {
    return (
      <InviteShell>
        <Clock size={32} className="text-amber-400 mx-auto mb-4" />
        <h1 className="text-[22px] font-black text-[#e8edf5] mb-2">
          Invitation expired
        </h1>
        <p className="text-[13px] text-[#5a6478] mb-6">
          This invitation expired on{" "}
          {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
          . Ask {invitation.inviterName} to send a new one.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[13px] text-[#e8edf5] hover:bg-white/[0.1] transition-colors"
        >
          Go to dashboard
        </Link>
      </InviteShell>
    );
  }

  if (invitation.status === "revoked") {
    return (
      <InviteShell>
        <XCircle size={32} className="text-red-400 mx-auto mb-4" />
        <h1 className="text-[22px] font-black text-[#e8edf5] mb-2">
          Invitation revoked
        </h1>
        <p className="text-[13px] text-[#5a6478] mb-6">
          This invitation was revoked. Contact {invitation.inviterName} if you
          think this is a mistake.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[13px] text-[#e8edf5] hover:bg-white/[0.1] transition-colors"
        >
          Go to dashboard
        </Link>
      </InviteShell>
    );
  }

  if (invitation.status === "accepted") {
    return (
      <InviteShell>
        <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-4" />
        <h1 className="text-[22px] font-black text-[#e8edf5] mb-2">
          Already accepted
        </h1>
        <p className="text-[13px] text-[#5a6478] mb-6">
          You've already joined {invitation.organizationName}.
        </p>
        <Link
          href={`/org/${invitation.organizationSlug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 transition-colors"
        >
          Open organization
          <ArrowRight size={13} />
        </Link>
      </InviteShell>
    );
  }

  return (
    <InviteShell>
      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
        <Users size={20} className="text-blue-400" />
      </div>

      <h1 className="text-[22px] font-black text-[#e8edf5] mb-2">
        You're invited!
      </h1>
      <p className="text-[13px] text-[#5a6478] mb-6">
        {invitation.inviterName} has invited you to join
      </p>

      <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 mb-6 text-left">
        <div className="text-[18px] font-black text-[#e8edf5] mb-1">
          {invitation.organizationName}
        </div>
        <div className="text-[12px] text-[#5a6478]">
          Your role:{" "}
          <span className="text-[#e8edf5] capitalize font-medium">
            {invitation.role}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2.5 mb-4 text-left">
          {error}
        </div>
      )}

      <button
        onClick={handleAccept}
        disabled={accepting}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-[14px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_4px_20px_rgba(59,127,255,0.4)]"
      >
        {accepting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Joining...
          </>
        ) : (
          <>
            Accept and join
            <ArrowRight size={14} />
          </>
        )}
      </button>

      <p className="text-[11px] text-[#5a6478] mt-4">
        Expires{" "}
        {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}
      </p>
    </InviteShell>
  );
}

function InviteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={14} className="text-blue-400 fill-blue-500" />
          <span className="text-[15px] font-black tracking-tight text-[#e8edf5]">
            Collabify AI
          </span>
        </div>
        <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-8 text-center">
          {children}
        </div>
      </div>
    </div>
  );
}