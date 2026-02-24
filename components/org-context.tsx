"use client";

import { createContext, useContext, ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";

type OrgWithMembership = Doc<"organizations"> & {
  role: string;
  joinedAt: number;
  memberCount: number;
  documentCount: number;
};

type OrgContextValue = {
  org: OrgWithMembership | null | undefined;
  slug: string;
  isLoading: boolean;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) {
  const org = useQuery(api.organizations.getOrgOverview, { slug });

  return (
    <OrgContext.Provider
      value={{
        org,
        slug,
        isLoading: org === undefined,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider");
  return ctx;
}