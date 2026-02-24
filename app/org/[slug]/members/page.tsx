"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrg } from "@/components/org-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Users,
  Mail,
  Plus,
  X,
  Crown,
  Shield,
  User,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";

const roleConfig = {
  owner: {
    icon: Crown,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  admin: {
    icon: Shield,
    color: "text-blue-400",
    bg: "bg-blue-400/10 border-blue-400/20",
  },
  member: {
    icon: User,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  viewer: {
    icon: Eye,
    color: "text-[#5a6478]",
    bg: "bg-white/[0.05] border-white/[0.1]",
  },
};

const statusConfig = {
  pending: { icon: Clock, color: "text-amber-400", label: "Pending" },
  accepted: {
    icon: CheckCircle2,
    color: "text-emerald-400",
    label: "Accepted",
  },
  expired: { icon: XCircle, color: "text-[#5a6478]", label: "Expired" },
  revoked: { icon: XCircle, color: "text-red-400", label: "Revoked" },
};

export default function MembersPage() {
  const { org } = useOrg();
  const router = useRouter();

  const members = useQuery(
    api.organizations.getMembers,
    org ? { organizationId: org._id } : "skip"
  );

  const invitations = useQuery(
    api.invitations.list,
    org ? { organizationId: org._id } : "skip"
  );

  const myMembership = useQuery(
    api.organizations.getMyMembership,
    org ? { organizationId: org._id } : "skip"
  );

  const createInvitation = useMutation(api.invitations.create);
  const revokeInvitation = useMutation(api.invitations.revoke);
  const updateRole = useMutation(api.organizations.updateMemberRole);
  const removeMember = useMutation(api.organizations.removeMember);
  const leaveOrganization = useMutation(api.organizations.leaveOrganization);
  const transferOwnership = useMutation(api.organizations.transferOwnership);

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);

  const canManageMembers = org && ["owner", "admin"].includes(org.role);
  const isOwner = org?.role === "owner";

  const pendingInvitations =
    invitations?.filter((inv) => inv.status === "pending") ?? [];
  const pastInvitations =
    invitations?.filter((inv) => inv.status !== "pending") ?? [];

  const handleInvite = async () => {
    if (!org || !email.trim()) return;
    setSending(true);
    setInviteError(null);
    try {
      await createInvitation({
        organizationId: org._id,
        email: email.trim(),
        role: inviteRole,
      });
      setEmail("");
      setInviteRole("member");
      setShowInviteForm(false);
    } catch (err) {
      setInviteError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
    } finally {
      setSending(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!org) return;
    setActionError(null);
    try {
      await updateRole({
        organizationId: org._id,
        userId: userId as any,
        newRole,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to update role"
      );
    }
  };

  const handleRemove = async (userId: string) => {
    if (!org) return;
    setActionError(null);
    try {
      await removeMember({
        organizationId: org._id,
        userId: userId as any,
      });
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to remove member"
      );
    }
  };

  const handleLeave = async () => {
    if (!org) return;
    setActionError(null);
    try {
      await leaveOrganization({ organizationId: org._id });
      router.push("/dashboard");
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to leave organization"
      );
    }
  };

  const handleTransferOwnership = async (userId: string) => {
    if (!org) return;
    setActionError(null);
    try {
      await transferOwnership({
        organizationId: org._id,
        newOwnerId: userId as any,
      });
      setTransferTarget(null);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Failed to transfer ownership"
      );
    }
  };

  // Roles that the current actor is allowed to assign
  const assignableRoles = () => {
    if (!org) return [];
    if (org.role === "owner") return ["owner", "admin", "member", "viewer"];
    if (org.role === "admin") return ["admin", "member", "viewer"];
    return [];
  };

  if (!org) return null;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
            Members
          </h1>
          <p className="text-[13px] text-[#5a6478]">
            {members
              ? `${members.length} member${
                  members.length !== 1 ? "s" : ""
                } in ${org.name}`
              : "Loading..."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLeave}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-red-400 hover:border-red-400/30 transition-colors"
          >
            <LogOut size={13} />
            Leave
          </button>
          {canManageMembers && !showInviteForm && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 transition-colors"
            >
              <Plus size={14} />
              Invite member
            </button>
          )}
        </div>
      </div>

      {/* Global action error */}
      {actionError && (
        <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            title="close button"
            onClick={() => setActionError(null)}
            className="text-red-400/60 hover:text-red-400 transition-colors ml-3"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Transfer ownership confirmation */}
      {transferTarget && (
        <div className="bg-amber-400/[0.06] border border-amber-400/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Crown size={14} className="text-amber-400" />
            <span className="text-[13px] font-semibold text-amber-400">
              Confirm ownership transfer
            </span>
          </div>
          <p className="text-[13px] text-[#5a6478] mb-4">
            You will be demoted to admin. This cannot be undone without the new
            owner's cooperation.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleTransferOwnership(transferTarget)}
              className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[13px] font-semibold hover:bg-amber-400/20 transition-colors"
            >
              Yes, transfer ownership
            </button>
            <button
              onClick={() => setTransferTarget(null)}
              className="px-4 py-2 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Invite form */}
      {showInviteForm && (
        <div className="bg-[#0d1420] border border-blue-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Mail size={15} className="text-blue-400" />
              <span className="text-[14px] font-semibold text-[#e8edf5]">
                Invite a team member
              </span>
            </div>
            <button
              title="close button"
              onClick={() => {
                setShowInviteForm(false);
                setInviteError(null);
                setEmail("");
              }}
              className="text-[#5a6478] hover:text-[#e8edf5] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                placeholder="colleague@example.com"
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/40 focus:bg-white/[0.06] transition-colors"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-1.5">
                Role
              </label>
              <select
                title="invite select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] focus:outline-none focus:border-blue-500/40 transition-colors appearance-none cursor-pointer"
              >
                <option value="viewer" className="bg-[#0d1420]">
                  Viewer — read-only access
                </option>
                <option value="member" className="bg-[#0d1420]">
                  Member — can create and edit documents
                </option>
                <option value="admin" className="bg-[#0d1420]">
                  Admin — full access except org deletion
                </option>
                {isOwner && (
                  <option value="owner" className="bg-[#0d1420]">
                    Owner — complete control
                  </option>
                )}
              </select>
            </div>
            {inviteError && (
              <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-2.5">
                {inviteError}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleInvite}
                disabled={sending || !email.trim()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={13} />
                    Send invitation
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteError(null);
                  setEmail("");
                }}
                className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] hover:border-white/[0.2] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
            <Clock size={13} className="text-amber-400" />
            <span className="text-[13px] font-semibold text-[#e8edf5]">
              Pending invitations
            </span>
            <span className="ml-auto text-[11px] text-[#5a6478]">
              {pendingInvitations.length} waiting
            </span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation._id}
                className="flex items-center gap-4 px-5 py-3.5"
              >
                <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                  <Mail size={13} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-[#e8edf5] truncate">
                    {invitation.email}
                  </div>
                  <div className="text-[11px] text-[#5a6478]">
                    Invited by {invitation.inviterName} as{" "}
                    <span className="capitalize">{invitation.role}</span> ·
                    Expires{" "}
                    {new Date(invitation.expiresAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    )}
                  </div>
                </div>
                {canManageMembers && (
                  <button
                    onClick={() =>
                      revokeInvitation({
                        invitationId: invitation._id as any,
                      })
                    }
                    className="text-[12px] text-[#5a6478] hover:text-red-400 transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current members */}
      <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
          <Users size={13} className="text-[#5a6478]" />
          <span className="text-[13px] font-semibold text-[#e8edf5]">
            Team members
          </span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {members === undefined ? (
            <div className="px-5 py-8 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : (
            members.map((member) => {
              const roleCfg =
                roleConfig[member.role as keyof typeof roleConfig] ??
                roleConfig.member;
              const RoleIcon = roleCfg.icon;
              const isSelf = member.userId === myMembership?.userId;
              const roles = assignableRoles();
              const canEditThisMember =
                canManageMembers && member.role !== "owner" && !isSelf;

              return (
                <div
                  key={member.userId}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[12px] font-bold text-white shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[#e8edf5] truncate">
                      {member.name}
                      {isSelf && (
                        <span className="ml-1.5 text-[10px] font-normal text-[#5a6478]">
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5a6478] truncate">
                      {member.email}
                    </div>
                  </div>

                  {/* Role control */}
                  {canEditThisMember && roles.length > 0 ? (
                    <div className="relative shrink-0">
                      <select
                        title="role select"
                        value={member.role}
                        onChange={(e) =>
                          handleRoleChange(member.userId, e.target.value)
                        }
                        className={`appearance-none bg-transparent border rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize cursor-pointer focus:outline-none pr-6 ${roleCfg.bg} ${roleCfg.color}`}
                      >
                        {roles.map((r) => (
                          <option key={r} value={r} className="bg-[#0d1420]">
                            {r}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={10}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${roleCfg.color}`}
                      />
                    </div>
                  ) : (
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold capitalize shrink-0 ${roleCfg.bg} ${roleCfg.color}`}
                    >
                      <RoleIcon size={10} />
                      {member.role}
                    </div>
                  )}

                  {/* Member actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isOwner && member.role !== "owner" && !isSelf && (
                      <button
                        onClick={() => setTransferTarget(member.userId)}
                        className="text-[11px] text-amber-400/60 hover:text-amber-400 transition-colors whitespace-nowrap"
                      >
                        Transfer
                      </button>
                    )}
                    {canManageMembers && member.role !== "owner" && !isSelf && (
                      <button
                        onClick={() => handleRemove(member.userId)}
                        className="text-[11px] text-[#5a6478] hover:text-red-400 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Past invitations */}
      {pastInvitations.length > 0 && (
        <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/[0.07]">
            <span className="text-[13px] font-semibold text-[#e8edf5]">
              Past invitations
            </span>
          </div>
          <div className="divide-y divide-white/[0.05]">
            {pastInvitations.map((invitation) => {
              const statusCfg =
                statusConfig[invitation.status as keyof typeof statusConfig] ??
                statusConfig.expired;
              const StatusIcon = statusCfg.icon;
              return (
                <div
                  key={invitation._id}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <StatusIcon
                    size={15}
                    className={`shrink-0 ${statusCfg.color}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-[#5a6478] truncate">
                      {invitation.email}
                    </div>
                    <div className="text-[11px] text-[#5a6478]">
                      {statusCfg.label} ·{" "}
                      <span className="capitalize">{invitation.role}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}