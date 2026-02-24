import Link from "next/link";
import { Zap } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={14} className="text-blue-400 fill-blue-500" />
          <span className="text-[15px] font-black tracking-tight text-[#e8edf5]">
            Collabify AI
          </span>
        </div>
        <div className="text-[72px] font-black text-[#e8edf5] leading-none mb-4">
          404
        </div>
        <p className="text-[14px] font-semibold text-[#e8edf5] mb-2">
          Page not found
        </p>
        <p className="text-[13px] text-[#5a6478] mb-8">
          The page you are looking for does not exist or you do not have access to it.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 transition-colors"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}