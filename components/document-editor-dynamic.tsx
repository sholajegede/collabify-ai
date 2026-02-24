"use client";

import dynamic from "next/dynamic";

export const DocumentEditor = dynamic(
  () => import("./document-editor"),
  { ssr: false }
);