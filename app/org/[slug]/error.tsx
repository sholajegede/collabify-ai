"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, RotateCcw } from "lucide-react";

export default function OrgError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Org route error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-[#0d1420] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
        <h2 className="text-[16px] font-bold text-[#e8edf5] mb-2">
          Something went wrong
        </h2>
        <p className="text-[13px] text-[#5a6478] leading-relaxed mb-6">
          {error.message || "An unexpected error occurred in this section."}
        </p>
        <div className="flex gap-2 justify-center">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-[13px] text-[#e8edf5] hover:bg-white/[0.1] transition-colors"
          >
            <RotateCcw size={13} />
            Try again
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.07] text-[13px] text-[#5a6478] hover:text-[#e8edf5] transition-colors"
          >
            <ArrowLeft size={13} />
            Back to dashboard
          </button>
        </div>
        {error.digest && (
          <p className="text-[10px] text-[#5a6478] mt-4 font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
