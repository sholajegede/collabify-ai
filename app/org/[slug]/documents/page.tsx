// app/org/[slug]/documents/page.tsx
"use client";

import { useMutation } from "convex/react";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrg } from "@/components/org-context";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Share2,
  MoreHorizontal,
  Clock,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useDelayedLoading } from "@/lib/use-delayed-loading";

function DropdownPortal({
  anchorRef,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 4,
        left: rect.right + window.scrollX - 160,
      });
    }

    const handleClickOutside = () => onClose();
    const handleScroll = () => onClose();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      style={{ position: "absolute", top: coords.top, left: coords.left }}
      className="w-40 bg-[#111827] border border-white/[0.1] rounded-xl shadow-2xl py-1 z-[9999]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}

const PAGE_SIZE = 24;

export default function DocumentsPage() {
  const { org } = useOrg();
  const router = useRouter();

  const {
    results: documents,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.documents.listPaginated,
    org ? { organizationId: org._id } : "skip",
    { initialNumItems: PAGE_SIZE }
  );

  const createDocument = useMutation(api.documents.create);
  const removeDocument = useMutation(api.documents.remove);

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const menuButtonRefs = useRef<Map<string, HTMLButtonElement | null>>(
    new Map()
  );
  const menuAnchorRef = useRef<HTMLButtonElement | null>(null);

  const canCreate = org && ["owner", "admin", "member"].includes(org.role);
  const canDelete = org && ["owner", "admin"].includes(org.role);

  // Client-side search filters the already-loaded pages.
  // For organizations with very large document counts, replace this
  // with a server-side search index once Convex releases it GA.
  const filtered = documents.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = status === "LoadingFirstPage";

  const handleCreate = async () => {
    if (!org || !newTitle.trim()) return;
    setError(null);
    try {
      const id = await createDocument({
        organizationId: org._id,
        title: newTitle.trim(),
      });
      setNewTitle("");
      setCreating(false);
      router.push(`/org/${org.slug}/documents/${id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create document"
      );
    }
  };

  const handleDelete = async (documentId: string) => {
    setOpenMenu(null);
    if (
      !confirm(
        "Permanently delete this document and all its versions? This cannot be undone."
      )
    )
      return;
    try {
      await removeDocument({ documentId: documentId as any });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete document"
      );
    }
  };

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

  if (!org) return null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-[#e8edf5] leading-none mb-2">
            Documents
          </h1>
          <p className="text-[13px] text-[#5a6478]">
            {isLoading
              ? "Loading..."
              : `${filtered.length}${status === "CanLoadMore" ? "+" : ""} document${filtered.length !== 1 ? "s" : ""}${search ? " matching search" : ""}`}
          </p>
        </div>
        {canCreate && !creating && (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 transition-colors shrink-0"
          >
            <Plus size={14} />
            New document
          </button>
        )}
      </div>

      {error && (
        <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      {creating && (
        <div className="bg-[#0d1420] border border-blue-500/20 rounded-2xl p-5">
          <label className="text-[11px] font-semibold uppercase tracking-widest text-[#5a6478] block mb-2">
            Document title
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") {
                  setCreating(false);
                  setNewTitle("");
                }
              }}
              placeholder="Untitled document"
              className="flex-1 bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/40 transition-colors"
              autoFocus
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-[13px] font-semibold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setCreating(false);
                setNewTitle("");
              }}
              className="px-4 py-2.5 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {documents.length > 4 && (
        <div className="relative">
          <Search
            size={13}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5a6478]"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-[#0d1420] border border-white/[0.07] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/30 transition-colors"
          />
        </div>
      )}

      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#0d1420] border border-white/[0.07] rounded-2xl px-6 py-12 text-center">
          <FileText size={24} className="text-[#5a6478] mx-auto mb-3" />
          <p className="text-[14px] font-semibold text-[#e8edf5] mb-1">
            {search ? "No documents match your search" : "No documents yet"}
          </p>
          <p className="text-[13px] text-[#5a6478]">
            {search
              ? "Try a different search term"
              : canCreate
              ? "Create your first document to get started"
              : "Documents created by your team will appear here"}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((doc) => (
              <div
                key={doc._id}
                className="group relative bg-[#0d1420] border border-white/[0.07] rounded-2xl hover:border-white/[0.14] hover:bg-[#111827] transition-all duration-150 cursor-pointer"
                onClick={() =>
                  router.push(`/org/${org.slug}/documents/${doc._id}`)
                }
              >
                <div className="h-28 px-5 pt-5 pb-3 border-b border-white/[0.05] overflow-hidden">
                  <div className="space-y-1.5 pointer-events-none select-none">
                    <div className="h-2 rounded-full bg-white/[0.07] w-3/4" />
                    <div className="h-2 rounded-full bg-white/[0.05] w-full" />
                    <div className="h-2 rounded-full bg-white/[0.05] w-5/6" />
                    <div className="h-2 rounded-full bg-white/[0.04] w-2/3" />
                    <div className="h-2 rounded-full bg-white/[0.03] w-4/5" />
                  </div>
                </div>

                <div className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-[#e8edf5] truncate group-hover:text-white transition-colors leading-snug">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock size={10} className="text-[#5a6478] shrink-0" />
                        <span className="text-[11px] text-[#5a6478]">
                          {formatDate(doc.lastModifiedAt)}
                        </span>
                        {doc.aiAnalysis && (
                          <>
                            <span className="text-[#5a6478] text-[10px]">·</span>
                            <Sparkles size={9} className="text-blue-400 shrink-0" />
                            <span className="text-[11px] text-blue-400">
                              Analyzed
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() =>
                          router.push(
                            `/org/${org.slug}/documents/${doc._id}?share=1`
                          )
                        }
                        className="p-1.5 rounded-lg text-[#5a6478] hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                        title="Share"
                      >
                        <Share2 size={13} />
                      </button>

                      {canDelete && (
                        <button
                          ref={(el) => {
                            menuButtonRefs.current.set(doc._id, el);
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            const btn = menuButtonRefs.current.get(doc._id);
                            menuAnchorRef.current = btn ?? null;
                            setOpenMenu(
                              openMenu === doc._id ? null : doc._id
                            );
                          }}
                          className="p-1.5 rounded-lg text-[#5a6478] hover:text-[#e8edf5] hover:bg-white/[0.06] transition-colors"
                          title="More options"
                        >
                          <MoreHorizontal size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {openMenu === doc._id && (
                  <DropdownPortal
                    anchorRef={menuAnchorRef}
                    onClose={() => setOpenMenu(null)}
                  >
                    <button
                      onClick={() => handleDelete(doc._id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-red-400 hover:bg-red-500/[0.08] transition-colors"
                    >
                      <Trash2 size={12} />
                      Delete permanently
                    </button>
                  </DropdownPortal>
                )}
              </div>
            ))}
          </div>

          {/* Load more */}
          {status === "CanLoadMore" && !search && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => loadMore(PAGE_SIZE)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/[0.1] text-[#5a6478] text-[13px] hover:text-[#e8edf5] hover:border-white/[0.2] transition-colors"
              >
                Load more documents
              </button>
            </div>
          )}

          {status === "LoadingMore" && (
            <div className="flex justify-center pt-2">
              <Loader2 size={16} className="text-[#5a6478] animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  );
}