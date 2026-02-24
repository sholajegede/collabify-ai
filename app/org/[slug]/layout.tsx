// app/org/[slug]/layout.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { OrgProvider } from "@/components/org-context";
import { OrgSidebar } from "@/components/org-sidebar";

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/");
  }

  const { slug } = await params;

  return (
    <div className="min-h-screen bg-[#080c14] text-[#e8edf5] flex">
      <OrgProvider slug={slug}>
        <OrgSidebar slug={slug} />
        <div className="flex-1 flex flex-col md:pl-60">
          <main className="flex-1 px-6 md:px-8 py-8 w-full">{children}</main>
        </div>
      </OrgProvider>
    </div>
  );
}