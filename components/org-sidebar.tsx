"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useOrg } from "./org-context";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  LogOut,
  Zap,
  Plus,
} from "lucide-react";

const navItems = (slug: string) => [
  { icon: LayoutDashboard, label: "Overview", href: `/org/${slug}` },
  { icon: FileText, label: "Documents", href: `/org/${slug}/documents` },
  { icon: Users, label: "Members", href: `/org/${slug}/members` },
  { icon: Settings, label: "Settings", href: `/org/${slug}/settings` },
];

export function OrgSidebar({ slug }: { slug: string }) {
  const pathname = usePathname();
  const { org, isLoading } = useOrg();
  const allOrgs = useQuery(api.organizations.list);

  const roleColors: Record<string, string> = {
    owner: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    admin: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    member: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    viewer: "text-[#5a6478] bg-white/[0.05] border-white/[0.1]",
  };

  const roleStyle = org ? (roleColors[org.role] ?? roleColors.viewer) : "";

  const isActive = (href: string) => {
    if (href === `/org/${slug}`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="fixed inset-y-0 left-0 w-60 bg-[#0d1420] border-r border-white/[0.07] flex-col z-20 hidden md:flex">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.07]">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <Zap size={14} className="text-blue-400 fill-blue-500" />
          <span className="text-[15px] font-black tracking-tight group-hover:text-blue-400 transition-colors">
            Collabify AI
          </span>
        </Link>
      </div>

      {/* Org identity */}
      <div className="px-4 py-3 border-b border-white/[0.07]">
        {isLoading ? (
          <div className="h-10 rounded-lg bg-white/[0.04] animate-pulse" />
        ) : org ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                {org.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#e8edf5] truncate leading-none mb-0.5">
                  {org.name}
                </div>
                <div className="text-[10px] text-[#5a6478] truncate font-mono">
                  /{org.slug}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-1">
              <span
                className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full border ${roleStyle}`}
              >
                {org.role}
              </span>
              <span className="text-[10px] text-[#5a6478]">
                {org.memberCount} member{org.memberCount !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-[#5a6478] px-2">
            Organization not found
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems(slug).map(({ icon: Icon, label, href }) => {
          const active = isActive(href);
          return (
            <Link
              key={label}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                active
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  : "text-[#5a6478] hover:text-[#e8edf5] hover:bg-white/[0.04]"
              }`}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Org switcher */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#5a6478] px-2 mb-2">
          Your organizations
        </div>
        <div className="space-y-0.5">
          {allOrgs === undefined ? (
            <div className="h-8 rounded-lg bg-white/[0.04] animate-pulse mx-1" />
          ) : (
            allOrgs.map((o) => (
              <Link
                key={o._id}
                href={`/org/${o.slug}`}
                className={`flex items-center gap-2.5 px-2 py-2 rounded-lg transition-colors duration-150 ${
                  o.slug === slug
                    ? "bg-blue-500/10 border border-blue-500/20"
                    : "hover:bg-white/[0.04]"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-black shrink-0 ${
                    o.slug === slug
                      ? "bg-blue-500 text-white"
                      : "bg-white/[0.08] text-[#5a6478]"
                  }`}
                >
                  {o.name[0].toUpperCase()}
                </div>
                <span
                  className={`text-[12px] font-medium truncate ${
                    o.slug === slug ? "text-blue-400" : "text-[#5a6478]"
                  }`}
                >
                  {o.name}
                </span>
              </Link>
            ))
          )}
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 px-2 py-2 rounded-lg text-[#5a6478] hover:text-[#e8edf5] hover:bg-white/[0.04] transition-colors duration-150"
          >
            <div className="w-5 h-5 rounded flex items-center justify-center bg-white/[0.05] shrink-0">
              <Plus size={10} className="text-[#5a6478]" />
            </div>
            <span className="text-[12px] font-medium">New organization</span>
          </Link>
        </div>
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <LogoutLink className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#5a6478] hover:text-red-400 hover:bg-red-400/[0.06] transition-colors duration-150 text-[13px]">
          <LogOut size={13} />
          Sign out
        </LogoutLink>
      </div>
    </div>
  );
}