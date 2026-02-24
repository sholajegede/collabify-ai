import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Share2,
  LogOut,
  Zap,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, getUser } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/");
  }

  const user = await getUser();
  const initials =
    [user?.given_name, user?.family_name]
      .filter(Boolean)
      .map((n) => n![0])
      .join("")
      .toUpperCase() ||
    user?.email?.[0].toUpperCase() ||
    "?";

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: Share2, label: "Shared with me", href: "/dashboard/shared" },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-[#e8edf5]">

      {/* Sidebar — desktop */}
      <div className="fixed inset-y-0 left-0 w-60 bg-[#0d1420] border-r border-white/[0.07] flex-col z-20 hidden md:flex">
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/[0.07]">
          <Zap size={14} className="text-blue-400 fill-blue-500" />
          <span className="text-[15px] font-black tracking-tight">Collabify AI</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors duration-150 text-[#5a6478] hover:text-[#e8edf5] hover:bg-white/[0.04]"
            >
              <Icon size={15} strokeWidth={2} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-[#e8edf5] truncate">
                {user?.given_name ?? user?.email?.split("@")[0]}
              </div>
              <div className="text-[11px] text-[#5a6478] truncate">{user?.email}</div>
            </div>
            <LogoutLink className="text-[#5a6478] hover:text-red-400 transition-colors shrink-0">
              <LogOut size={13} />
            </LogoutLink>
          </div>
        </div>
      </div>

      {/* Mobile top nav */}
      <nav className="md:hidden flex items-center justify-between px-5 py-4 border-b border-white/[0.07] bg-[#0d1420] sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <Zap size={13} className="text-blue-400 fill-blue-500" />
          <span className="text-[15px] font-black tracking-tight">Collabify AI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#5a6478]">{user?.email}</span>
          <LogoutLink className="flex items-center gap-1.5 text-[12px] text-red-400 hover:text-red-300 transition-colors">
            <LogOut size={12} />
            Sign out
          </LogoutLink>
        </div>
      </nav>

      {/* Main content */}
      <div className="md:pl-60">
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-white/[0.07] bg-[#080c14]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="text-[13px] text-[#5a6478]">
            Welcome back,{" "}
            <span className="text-[#e8edf5] font-medium">
              {user?.given_name ?? user?.email?.split("@")[0]}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#00d4aa]" />
            <span className="text-[12px] text-[#5a6478]">All systems operational</span>
          </div>
        </header>

        <main className="px-6 md:px-8 py-8 w-full">{children}</main>
      </div>
    </div>
  );
}