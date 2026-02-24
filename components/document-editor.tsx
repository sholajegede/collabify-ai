// components/document-editor.tsx
"use client";

import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCallback, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DocumentEditorProps {
  content: string;
  editable: boolean;
  onChange: (content: string) => void;
}

const theme = {
  colors: {
    editor: { text: "#c8d0e0", background: "#080c14" },
    menu: { text: "#c8d0e0", background: "#0d1420" },
    tooltip: { text: "#c8d0e0", background: "#0d1420" },
    hovered: { text: "#e8edf5", background: "#ffffff08" },
    selected: { text: "#e8edf5", background: "#3b82f620" },
    disabled: { text: "#5a6478", background: "#080c14" },
    shadow: "#00000060",
    border: "#ffffff12",
    sideMenu: "#5a6478",
    highlights: {
      gray: { text: "#9ca3af", background: "#374151" },
      brown: { text: "#d97706", background: "#78350f" },
      red: { text: "#f87171", background: "#7f1d1d" },
      orange: { text: "#fb923c", background: "#7c2d12" },
      yellow: { text: "#fbbf24", background: "#713f12" },
      green: { text: "#4ade80", background: "#14532d" },
      blue: { text: "#60a5fa", background: "#1e3a5f" },
      purple: { text: "#c084fc", background: "#4a1d96" },
      pink: { text: "#f472b6", background: "#831843" },
    },
  },
  borderRadius: 8,
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;

export default function DocumentEditor({
  content,
  editable,
  onChange,
}: DocumentEditorProps) {
  const isInitialized = useRef(false);
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const getFileUrl = useMutation(api.files.getFileUrl);

  const handleUpload = useCallback(
    async (file: File): Promise<string> => {
      // Step 1: get a short-lived upload URL from Convex storage
      const uploadUrl = await generateUploadUrl();

      // Step 2: POST the file directly to that URL
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const { storageId } = await response.json();

      // Step 3: exchange the storageId for a permanent serving URL
      const url = await getFileUrl({ storageId });
      if (!url) throw new Error("Failed to get file URL");

      return url;
    },
    [generateUploadUrl, getFileUrl]
  );

  const editor = useCreateBlockNote({
    initialContent: (() => {
      if (!content) return undefined;
      try {
        const parsed = JSON.parse(content);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return [
          {
            type: "paragraph",
            content: [{ type: "text", text: content, styles: {} }],
          },
        ];
      }
    })(),
    uploadFile: handleUpload,
  });

  useEffect(() => {
    const unsubscribe = editor.onChange(() => {
      if (!isInitialized.current) {
        isInitialized.current = true;
        return;
      }
      onChange(JSON.stringify(editor.document));
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [editor, onChange]);

  return (
    <BlockNoteView
      editor={editor}
      editable={editable}
      theme={theme}
      className="min-h-[400px] -mx-[54px]"
    />
  );
}