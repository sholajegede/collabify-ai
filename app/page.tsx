import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import {
  Zap,
  Building2,
  ShieldCheck,
  Mail,
  Radio,
  Lock,
  Bot,
  ArrowRight,
  Check,
  Users,
  GitBranch,
  Globe,
  Webhook,
  Database,
  ChevronRight,
  Star,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    color: "blue",
    name: "Multi-org architecture",
    desc: "Users belong to multiple organizations simultaneously. Contractors, consultants, and cross-functional teams all handled natively.",
  },
  {
    icon: ShieldCheck,
    color: "emerald",
    name: "Hierarchical permissions",
    desc: "Owner, admin, member, viewer — enforced at the query layer, not just the UI. No accidental data leaks, ever.",
  },
  {
    icon: Mail,
    color: "violet",
    name: "Secure invitations",
    desc: "Token-based email invitations with expiry, revocation, and duplicate prevention built in from day one.",
  },
  {
    icon: Radio,
    color: "emerald",
    name: "Real-time by default",
    desc: "Powered by Convex reactive queries. When Mike joins Sarah's org, her UI updates instantly — no polling, no WebSockets.",
  },
  {
    icon: Lock,
    color: "blue",
    name: "Complete data isolation",
    desc: "Every query filters by organizationId. Tenant data is structurally impossible to leak across org boundaries.",
  },
  {
    icon: Bot,
    color: "violet",
    name: "AI-ready infrastructure",
    desc: "Rate limiting, async job queues, and usage tracking baked in. Run LLM workloads without starving other tenants.",
  },
];

const steps = [
  {
    n: "01",
    title: "Create your workspace",
    desc: "Sign up and your account is provisioned instantly. No credit card, no setup wizard, no waiting.",
  },
  {
    n: "02",
    title: "Invite your team",
    desc: "Send token-based invitations with role assignment. Members land directly in your workspace.",
  },
  {
    n: "03",
    title: "Build with AI together",
    desc: "Every document, analysis, and AI job is scoped to your organization. Collaborate in real time.",
  },
];

const techStack = [
  { icon: Globe, label: "Next.js 16", desc: "App Router, React 19, Turbopack" },
  { icon: ShieldCheck, label: "Kinde Auth", desc: "B2B auth, org management, MFA" },
  { icon: Database, label: "Convex", desc: "Real-time reactive database" },
  { icon: Webhook, label: "Webhooks", desc: "JWT-signed event delivery" },
  { icon: GitBranch, label: "TypeScript", desc: "End-to-end type safety" },
  { icon: Bot, label: "AI-native", desc: "Rate limiting & async jobs built in" },
];

const testimonials = [
  {
    quote: "Finally, a multi-tenant setup that doesn't take three sprints to get right. The permission system alone saved us weeks.",
    name: "Sarah K.",
    role: "Lead Engineer, LegalAI",
    initials: "SK",
  },
  {
    quote: "We went from zero to a working org system in a day. The webhook sync is the piece every tutorial skips — this doesn't.",
    name: "James O.",
    role: "Founder, DocFlow",
    initials: "JO",
  },
  {
    quote: "The data isolation pattern is exactly what we needed for HIPAA compliance. Rock solid and easy to reason about.",
    name: "Priya M.",
    role: "CTO, MedAssist",
    initials: "PM",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#080c14] text-[#e8edf5] overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-white/[0.07] backdrop-blur-md bg-[#080c14]/80">
        <div className="flex items-center gap-2 text-[15px] font-black tracking-tight">
          <Zap size={14} className="text-blue-400 fill-blue-500" />
          Collabify AI
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Features", "How it works", "Stack", "Pricing"].map((item) => (
            <span key={item} className="text-[13px] text-[#5a6478] hover:text-[#e8edf5] cursor-pointer transition-colors">
              {item}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <LoginLink className="hidden md:inline-flex text-[13px] text-[#5a6478] hover:text-[#e8edf5] px-4 py-2 transition-colors">
            Sign in
          </LoginLink>
          <RegisterLink className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-medium rounded-lg transition-all duration-200 hover:shadow-[0_4px_20px_rgba(59,127,255,0.4)]">
            Get started <ArrowRight size={13} />
          </RegisterLink>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="relative px-6 md:px-12 pt-20 md:pt-32 pb-20 text-center max-w-5xl mx-auto">
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-emerald-400/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2.5 text-[11px] font-medium tracking-[0.12em] uppercase text-[#5a6478] border border-white/[0.12] px-4 py-1.5 rounded-full mb-8">
            <span className="w-4 h-px bg-blue-500" />
            Built for AI-first teams
            <span className="w-4 h-px bg-blue-500" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-[-3px] md:tracking-[-4px] leading-[0.95] mb-6">
            <span className="block text-[#e8edf5]">Where teams build</span>
            <span className="block bg-gradient-to-r from-blue-400 via-blue-500 to-emerald-400 bg-clip-text text-transparent pb-2">
              AI, together.
            </span>
          </h1>

          <p className="text-base md:text-lg font-light leading-relaxed text-[#5a6478] max-w-xl mx-auto mb-10">
            Multi-tenant collaboration infrastructure for AI applications. Invite your team,
            define roles, share context —{" "}
            <span className="text-[#8fa3c0] font-normal">
              built for the way modern AI teams actually work.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <RegisterLink className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-500 hover:bg-blue-400 text-white text-[15px] font-medium rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(59,127,255,0.4)]">
              Start for free <ArrowRight size={15} />
            </RegisterLink>
            <LoginLink className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-transparent hover:bg-white/[0.04] text-[#e8edf5] text-[15px] font-normal rounded-xl border border-white/[0.14] hover:border-white/25 transition-all duration-200 hover:-translate-y-px">
              Sign in <ChevronRight size={15} />
            </LoginLink>
          </div>

          <p className="mt-5 text-[12px] text-[#5a6478]">
            No credit card required · Free to start · Deploy in minutes
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-6 md:px-12 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 border border-white/[0.07] rounded-2xl bg-[#0d1420]/80 backdrop-blur-sm overflow-hidden">
          {[
            { value: "∞", label: "Orgs per user" },
            { value: "4", label: "Role levels" },
            { value: "RT", label: "Real-time sync" },
            { value: "0ms", label: "Setup time" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`px-6 py-6 text-center ${
                i % 2 === 0 && i < 3 ? "border-r border-white/[0.07]" : ""
              } ${i < 2 ? "border-b md:border-b-0 border-white/[0.07]" : ""} ${
                i === 1 ? "md:border-r border-white/[0.07]" : ""
              } ${i === 2 ? "md:border-r border-white/[0.07]" : ""}`}
            >
              <div className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-[11px] text-[#5a6478] tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-blue-500 mb-4">
            Everything you need
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] leading-tight text-[#e8edf5]">
            Team collaboration,<br className="hidden md:block" /> without the complexity
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.07] border border-white/[0.07] rounded-2xl overflow-hidden">
          {features.map(({ icon: Icon, color, name, desc }) => (
            <div key={name} className="bg-[#0d1420] hover:bg-[#101828] transition-colors duration-200 p-8 group">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-colors duration-200 ${
                  color === "blue"
                    ? "bg-blue-500/[0.08] border border-blue-500/[0.15] group-hover:bg-blue-500/[0.14]"
                    : color === "emerald"
                    ? "bg-emerald-400/[0.08] border border-emerald-400/[0.15] group-hover:bg-emerald-400/[0.14]"
                    : "bg-violet-500/[0.08] border border-violet-500/[0.15] group-hover:bg-violet-500/[0.14]"
                }`}
              >
                <Icon
                  size={17}
                  className={
                    color === "blue" ? "text-blue-400"
                    : color === "emerald" ? "text-emerald-400"
                    : "text-violet-400"
                  }
                />
              </div>
              <div className="text-[15px] font-semibold tracking-tight text-[#e8edf5] mb-2.5">{name}</div>
              <div className="text-[13px] font-light leading-relaxed text-[#5a6478]">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-emerald-500 mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] leading-tight text-[#e8edf5]">
            From zero to collaborative<br className="hidden md:block" /> in three steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map(({ n, title, desc }, i) => (
            <div key={n} className="relative">
              {i < 2 && (
                <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-white/[0.1] to-transparent z-10 -translate-y-px" />
              )}
              <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-7 hover:border-white/[0.13] transition-colors duration-200 h-full">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[13px] font-black text-blue-400 mb-5">
                  {n}
                </div>
                <h3 className="text-[15px] font-semibold text-[#e8edf5] mb-2.5">{title}</h3>
                <p className="text-[13px] font-light leading-relaxed text-[#5a6478]">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Tech stack ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-violet-400 mb-4">
            The stack
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] leading-tight text-[#e8edf5]">
            Best-in-class tools,<br className="hidden md:block" /> wired together correctly
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {techStack.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-5 hover:border-white/[0.13] transition-colors duration-200 flex items-start gap-4"
            >
              <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
                <Icon size={15} className="text-[#8fa3c0]" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#e8edf5] mb-0.5">{label}</div>
                <div className="text-[12px] text-[#5a6478] leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-amber-400 mb-4">
            What builders say
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] leading-tight text-[#e8edf5]">
            Trusted by AI teams<br className="hidden md:block" /> shipping fast
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(({ quote, name, role, initials }) => (
            <div
              key={name}
              className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-6 flex flex-col gap-5 hover:border-white/[0.13] transition-colors duration-200"
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={12} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-[13px] font-light leading-relaxed text-[#8fa3c0] flex-1">
                "{quote}"
              </p>
              <div className="flex items-center gap-3 pt-1 border-t border-white/[0.06]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                  {initials}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-[#e8edf5]">{name}</div>
                  <div className="text-[11px] text-[#5a6478]">{role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 md:px-12 pb-28">
        <div className="text-center mb-14">
          <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-blue-500 mb-4">
            Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-black tracking-[-1.5px] leading-tight text-[#e8edf5]">
            Simple, honest pricing
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Free */}
          <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl p-7">
            <div className="text-[13px] font-semibold text-[#5a6478] uppercase tracking-widest mb-4">Free</div>
            <div className="text-4xl font-black tracking-tight text-[#e8edf5] mb-1">$0</div>
            <div className="text-[13px] text-[#5a6478] mb-7">Forever free, no card needed</div>
            <div className="space-y-3 mb-8">
              {["Up to 3 organizations", "5 members per org", "100 documents", "Community support"].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={14} className="text-emerald-400 shrink-0" />
                  <span className="text-[13px] text-[#8fa3c0]">{item}</span>
                </div>
              ))}
            </div>
            <RegisterLink className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/[0.06] hover:bg-white/[0.1] text-[#e8edf5] text-[14px] font-medium rounded-xl border border-white/[0.1] transition-all duration-200">
              Get started free <ArrowRight size={14} />
            </RegisterLink>
          </div>

          {/* Pro */}
          <div className="relative bg-gradient-to-br from-blue-500/[0.1] to-emerald-500/[0.05] border border-blue-500/30 rounded-2xl p-7 overflow-hidden">
            <div className="absolute top-4 right-4 text-[10px] font-semibold tracking-widest uppercase text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
              Popular
            </div>
            <div className="text-[13px] font-semibold text-blue-400 uppercase tracking-widest mb-4">Pro</div>
            <div className="text-4xl font-black tracking-tight text-[#e8edf5] mb-1">
              $29<span className="text-[18px] font-medium text-[#5a6478]">/mo</span>
            </div>
            <div className="text-[13px] text-[#5a6478] mb-7">Per workspace, billed monthly</div>
            <div className="space-y-3 mb-8">
              {[
                "Unlimited organizations",
                "Unlimited members",
                "Unlimited documents",
                "AI analysis pipeline",
                "Priority support",
                "Advanced audit logs",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <Check size={14} className="text-blue-400 shrink-0" />
                  <span className="text-[13px] text-[#8fa3c0]">{item}</span>
                </div>
              ))}
            </div>
            <RegisterLink className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white text-[14px] font-medium rounded-xl transition-all duration-200 hover:shadow-[0_4px_20px_rgba(59,127,255,0.4)]">
              Start free trial <ArrowRight size={14} />
            </RegisterLink>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ─────────────────────────────────────── */}
      <section className="relative px-6 md:px-12 py-24 border-t border-white/[0.07] text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.04] to-transparent pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-[-2px] leading-tight text-[#e8edf5] mb-5">
            Ready to build<br /> with your team?
          </h2>
          <p className="text-base text-[#5a6478] font-light mb-10">
            Free to start. No credit card required. Deploy in minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <RegisterLink className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 bg-blue-500 hover:bg-blue-400 text-white text-base font-medium rounded-xl transition-all duration-200 hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(59,127,255,0.4)]">
              Create your workspace <ArrowRight size={16} />
            </RegisterLink>
            <LoginLink className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 bg-transparent hover:bg-white/[0.04] text-[#e8edf5] text-base rounded-xl border border-white/[0.14] hover:border-white/25 transition-all duration-200">
              Sign in to existing account
            </LoginLink>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-white/[0.07] px-6 md:px-12 py-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-[14px] font-black tracking-tight">
            <Zap size={13} className="text-blue-400 fill-blue-500" />
            Collabify AI
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {["Features", "How it works", "Pricing", "Docs", "GitHub"].map((item) => (
              <span key={item} className="text-[13px] text-[#5a6478] hover:text-[#e8edf5] cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#5a6478]">
            <span>Built with</span>
            <span className="text-[#e8edf5]">Next.js</span>
            <span>·</span>
            <span className="text-[#e8edf5]">Convex</span>
            <span>·</span>
            <span className="text-[#e8edf5]">Kinde</span>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-6 border-t border-white/[0.05] flex flex-col md:flex-row items-center justify-between gap-3">
          <span className="text-[12px] text-[#5a6478]">© 2025 Collabify AI. All rights reserved.</span>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Security"].map((item) => (
              <span key={item} className="text-[12px] text-[#5a6478] hover:text-[#e8edf5] cursor-pointer transition-colors">
                {item}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}