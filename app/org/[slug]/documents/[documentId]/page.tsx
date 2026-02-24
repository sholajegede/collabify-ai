// app/org/[slug]/documents/[documentId]/page.tsx
"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShareDialog } from "@/components/share-dialog";
import { DocumentEditor } from "@/components/document-editor-dynamic";
import {
  Share2,
  ArrowLeft,
  Sparkles,
  Clock,
  RotateCcw,
  Save,
  Users,
  ChevronDown,
  ChevronUp,
  Tag,
  MessageSquare,
  Send,
  Trash2,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";

const HEARTBEAT_INTERVAL = 30_000;
const SAVE_DEBOUNCE = 2_000;

export default function DocumentPage() {
  const params = useParams<{ slug: string; documentId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const showShare = searchParams.get("share") === "1";

  const document = useQuery(api.documents.get, {
    documentId: params.documentId as any,
  });
  const activeUsers = useQuery(api.presence.getActive, {
    documentId: params.documentId as any,
  });
  const versions = useQuery(api.documentVersions.list, {
    documentId: params.documentId as any,
  });
  const comments = useQuery(api.comments.list, {
    documentId: params.documentId as any,
  });

  const updateDocument = useMutation(api.documents.update);
  const analyzeDocument = useMutation(api.ai.analyze);
  const saveVersion = useMutation(api.documentVersions.save);
  const restoreVersion = useMutation(api.documentVersions.restore);
  const pingPresence = useMutation(api.presence.ping);
  const leavePresence = useMutation(api.presence.leave);
  const addComment = useMutation(api.comments.add);
  const removeComment = useMutation(api.comments.remove);
  const resolveComment = useMutation(api.comments.resolve);

  const [title, setTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const commentBoxRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (document) setTitle(document.title);
  }, [document?._id]);

  useEffect(() => {
    if (!document) return;
    pingPresence({ documentId: params.documentId as any }).catch(() => {});
    heartbeatTimer.current = setInterval(() => {
      pingPresence({ documentId: params.documentId as any }).catch(() => {});
    }, HEARTBEAT_INTERVAL);
    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current);
      leavePresence({ documentId: params.documentId as any }).catch(() => {});
    };
  }, [document?._id]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        try {
          await updateDocument({
            documentId: params.documentId as any,
            content: newContent,
          });
        } finally {
          setSaving(false);
        }
      }, SAVE_DEBOUNCE);
    },
    [params.documentId, updateDocument]
  );

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateDocument({
          documentId: params.documentId as any,
          title: newTitle,
        });
      } finally {
        setSaving(false);
      }
    }, SAVE_DEBOUNCE);
  };

  const handleSaveVersion = async () => {
    try {
      await saveVersion({
        documentId: params.documentId as any,
        changeDescription: "Manual save",
      });
    } catch (err) {
      console.error("Failed to save version", err);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      await analyzeDocument({ documentId: params.documentId as any });
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : "Analysis failed");
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (document?.aiAnalysis && analyzing) setAnalyzing(false);
  }, [document?.aiAnalysis]);

  const handleRestore = async (versionId: string) => {
    if (!confirm("Restore this version? Your current content will be saved automatically before restoring.")) return;
    try {
      await restoreVersion({ versionId: versionId as any });
    } catch (err) {
      console.error("Failed to restore version", err);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    setCommentError(null);
    try {
      await addComment({
        documentId: params.documentId as any,
        content: commentText.trim(),
      });
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await removeComment({ commentId: commentId as any });
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      await resolveComment({ commentId: commentId as any, resolved });
    } catch (err) {
      console.error("Failed to resolve comment", err);
    }
  };

  if (document === undefined) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[#e8edf5] mb-2">Document not found</p>
          <p className="text-[13px] text-[#5a6478] mb-4">
            You may not have access, or it may have been deleted.
          </p>
          <Link
            href={`/org/${params.slug}/documents`}
            className="text-[13px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            Back to documents
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = document.permissions.includes("edit");
  const canComment = document.permissions.includes("comment");

  const unresolvedComments = comments?.filter((c) => !c.resolved) ?? [];
  const resolvedComments = comments?.filter((c) => c.resolved) ?? [];

  const sentimentColor =
    document.aiAnalysis?.sentiment === "positive"
      ? "text-emerald-400"
      : document.aiAnalysis?.sentiment === "negative"
      ? "text-red-400"
      : "text-[#5a6478]";

  function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="h-full flex flex-col">

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.07] shrink-0 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            title="back button"
            onClick={() => router.push(`/org/${params.slug}/documents`)}
            className="text-[#5a6478] hover:text-[#e8edf5] transition-colors shrink-0"
          >
            <ArrowLeft size={15} />
          </button>
          {canEdit ? (
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="bg-transparent text-[14px] font-semibold text-[#e8edf5] focus:outline-none min-w-0 flex-1 truncate"
              placeholder="Untitled document"
            />
          ) : (
            <span className="text-[14px] font-semibold text-[#e8edf5] truncate">
              {document.title}
            </span>
          )}
          {document.accessSource === "share" && (
            <span className="text-[10px] text-blue-400 bg-blue-400/10 border border-blue-400/20 rounded-full px-2 py-0.5 font-medium shrink-0">
              Shared
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saving && <span className="text-[11px] text-[#5a6478]">Saving...</span>}

          {activeUsers && activeUsers.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.07]">
              <Users size={11} className="text-emerald-400" />
              <span className="text-[11px] text-[#5a6478]">{activeUsers.length} viewing</span>
            </div>
          )}

          {canComment && (
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] transition-colors ${
                showComments
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                  : "border-white/[0.1] text-[#5a6478] hover:text-[#e8edf5] hover:border-white/[0.2]"
              }`}
            >
              <MessageSquare size={12} />
              Comments
              {unresolvedComments.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                  {unresolvedComments.length > 9 ? "9+" : unresolvedComments.length}
                </span>
              )}
            </button>
          )}

          {canEdit && (
            <>
              <button
                onClick={handleSaveVersion}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-[#5a6478] text-[12px] hover:text-[#e8edf5] hover:border-white/[0.2] transition-colors"
              >
                <Save size={12} />
                Save version
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[12px] hover:bg-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {analyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={12} />
                    Analyze
                  </>
                )}
              </button>

              <button
                onClick={() =>
                  router.push(`/org/${params.slug}/documents/${params.documentId}?share=1`)
                }
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.1] text-[#5a6478] text-[12px] hover:text-[#e8edf5] hover:border-white/[0.2] transition-colors"
              >
                <Share2 size={12} />
                Share
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Editor area */}
        <div className="flex-1 overflow-auto px-6 py-8">
          <div className="max-w-3xl mx-auto space-y-6">

            {analyzeError && (
              <div className="text-[12px] text-red-400 bg-red-400/[0.08] border border-red-400/20 rounded-xl px-4 py-3">
                {analyzeError}
              </div>
            )}

            <DocumentEditor
              content={document.content}
              editable={canEdit}
              onChange={handleContentChange}
            />

            {document.aiAnalysis && (
              <div className="bg-blue-500/[0.05] border border-blue-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={13} className="text-blue-400" />
                    <span className="text-[12px] font-semibold text-blue-400 uppercase tracking-widest">
                      AI Analysis
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-medium capitalize ${sentimentColor}`}>
                      {document.aiAnalysis.sentiment}
                    </span>
                    <span className="text-[11px] text-[#5a6478]">
                      {new Date(document.aiAnalysis.processedAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] text-[#c8d0e0] leading-relaxed">
                  {document.aiAnalysis.summary}
                </p>
                {document.aiAnalysis.keywords.length > 0 && (
                  <div className="flex items-start gap-2 flex-wrap">
                    <Tag size={11} className="text-[#5a6478] mt-0.5 shrink-0" />
                    {document.aiAnalysis.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="text-[11px] bg-white/[0.05] border border-white/[0.1] rounded-full px-2.5 py-0.5 text-[#c8d0e0]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments sidebar */}
        {canComment && showComments && (
          <div className="w-72 border-l border-white/[0.07] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <div className="flex items-center gap-2">
                <MessageSquare size={12} className="text-[#5a6478]" />
                <span className="text-[12px] font-semibold text-[#e8edf5]">Comments</span>
                {unresolvedComments.length > 0 && (
                  <span className="text-[10px] text-[#5a6478]">
                    {unresolvedComments.length} open
                  </span>
                )}
              </div>
              {resolvedComments.length > 0 && (
                <button
                  onClick={() => setShowResolved(!showResolved)}
                  className="text-[10px] text-[#5a6478] hover:text-[#e8edf5] transition-colors"
                >
                  {showResolved ? "Hide resolved" : `+${resolvedComments.length} resolved`}
                </button>
              )}
            </div>

            {/* Comment input */}
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <textarea
                ref={commentBoxRef}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder="Add a comment..."
                rows={3}
                className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-[12px] text-[#e8edf5] placeholder-[#5a6478] focus:outline-none focus:border-blue-500/40 transition-colors resize-none"
              />
              {commentError && (
                <p className="text-[11px] text-red-400 mt-1">{commentError}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-[#5a6478]">
                  {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Enter to post
                </span>
                <button
                  onClick={handleAddComment}
                  disabled={submittingComment || !commentText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-[11px] font-semibold hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? (
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send size={10} />
                  )}
                  Post
                </button>
              </div>
            </div>

            {/* Comment list */}
            <div className="flex-1 overflow-auto py-2">
              {comments === undefined ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : unresolvedComments.length === 0 && !showResolved ? (
                <div className="px-4 py-8 text-center">
                  <MessageSquare size={16} className="text-[#5a6478] mx-auto mb-2" />
                  <p className="text-[12px] text-[#5a6478]">No comments yet</p>
                  <p className="text-[11px] text-[#5a6478]/60 mt-1">
                    Be the first to leave a comment
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {unresolvedComments.map((comment) => (
                    <div
                      key={comment._id}
                      className="px-4 py-3 hover:bg-white/[0.02] group transition-colors"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                          {comment.authorPicture ? (
                            <img
                              src={comment.authorPicture}
                              alt={comment.authorName}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            comment.authorName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[11px] font-semibold text-[#e8edf5] truncate">
                              {comment.authorName}
                            </span>
                            <span className="text-[10px] text-[#5a6478] shrink-0">
                              {timeAgo(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#c8d0e0] leading-relaxed break-words">
                            {comment.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {canEdit && (
                              <button
                                onClick={() => handleResolveComment(comment._id, true)}
                                className="flex items-center gap-1 text-[10px] text-[#5a6478] hover:text-emerald-400 transition-colors"
                              >
                                <CheckCheck size={10} />
                                Resolve
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="flex items-center gap-1 text-[10px] text-[#5a6478] hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={10} />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {showResolved && resolvedComments.length > 0 && (
                    <>
                      <div className="px-4 py-2">
                        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#5a6478]">
                          Resolved
                        </div>
                      </div>
                      {resolvedComments.map((comment) => (
                        <div
                          key={comment._id}
                          className="px-4 py-3 hover:bg-white/[0.02] group transition-colors opacity-50"
                        >
                          <div className="flex items-start gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#5a6478] to-[#3a4458] flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                              {comment.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[11px] font-semibold text-[#5a6478] truncate">
                                  {comment.authorName}
                                </span>
                                <span className="text-[10px] text-[#5a6478] shrink-0">
                                  {timeAgo(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#5a6478] leading-relaxed break-words line-through">
                                {comment.content}
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canEdit && (
                                  <button
                                    onClick={() => handleResolveComment(comment._id, false)}
                                    className="flex items-center gap-1 text-[10px] text-[#5a6478] hover:text-blue-400 transition-colors"
                                  >
                                    <RotateCcw size={10} />
                                    Reopen
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteComment(comment._id)}
                                  className="flex items-center gap-1 text-[10px] text-[#5a6478] hover:text-red-400 transition-colors"
                                >
                                  <Trash2 size={10} />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Version history sidebar */}
        {versions && versions.length > 0 && (
          <div className="w-64 border-l border-white/[0.07] flex flex-col shrink-0">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] text-[12px] text-[#5a6478] hover:text-[#e8edf5] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock size={12} />
                <span className="font-medium">
                  {versions.length} version{versions.length !== 1 ? "s" : ""}
                </span>
              </div>
              {showVersions ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showVersions && (
              <div className="flex-1 overflow-auto py-2">
                {versions.map((v) => (
                  <div
                    key={v._id}
                    className="px-4 py-3 hover:bg-white/[0.02] group transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-[#e8edf5]">
                        v{v.version}
                      </span>
                      {canEdit && (
                        <button
                          onClick={() => handleRestore(v._id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300"
                        >
                          <RotateCcw size={9} />
                          Restore
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5a6478] truncate">
                      {v.changeDescription ?? "No description"}
                    </div>
                    <div className="text-[11px] text-[#5a6478] mt-0.5">
                      by {v.authorName}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showShare && (
        <ShareDialog
          documentId={params.documentId}
          onClose={() =>
            router.push(`/org/${params.slug}/documents/${params.documentId}`)
          }
        />
      )}
    </div>
  );
}