import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { InvitationAccept } from "@/components/invitation-accept";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    // Send unauthenticated users to sign up, then back here after
    redirect(
      `/api/auth/register?post_login_redirect_url=${encodeURIComponent(`/invite/${token}`)}`
    );
  }

  return <InvitationAccept token={token} />;
}