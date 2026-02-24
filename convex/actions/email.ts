// convex/actions/email.ts
"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendInvitationEmail = internalAction({
  args: {
    organizationName: v.string(),
    inviterName: v.string(),
    recipientEmail: v.string(),
    role: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const isDev = process.env.NODE_ENV !== "production";

    // In development, Resend requires a verified domain.
    // Route all emails to their test address instead so you can
    // develop without domain setup. The invitation link is logged
    // to the Convex dashboard so you can still test the full flow.
    const toAddress = isDev ? "delivered@resend.dev" : args.recipientEmail;

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${args.token}`;

    if (isDev) {
      console.log(`[DEV] Invitation email for ${args.recipientEmail}`);
      console.log(`[DEV] Invitation URL: ${invitationUrl}`);
    }

    const { error } = await resend.emails.send({
      from: "Collabify AI <onboarding@resend.dev>",
      to: [toAddress],
      subject: `You've been invited to join ${args.organizationName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    max-width: 560px; margin: 0 auto; padding: 40px 20px;
                    background: #ffffff; color: #0f172a;">
          <div style="margin-bottom: 32px;">
            <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px;">
              Collabify AI
            </span>
          </div>
          <h1 style="font-size: 24px; font-weight: 800; margin: 0 0 12px;">
            You're invited to join ${args.organizationName}
          </h1>
          <p style="color: #64748b; font-size: 15px; line-height: 1.6; margin: 0 0 28px;">
            ${args.inviterName} has invited you to collaborate as a
            <strong style="color: #0f172a;">${args.role}</strong>.
          </p>
          <a href="${invitationUrl}"
             style="display: inline-block; background: #3b82f6; color: #ffffff;
                    padding: 14px 28px; border-radius: 10px; font-size: 15px;
                    font-weight: 600; text-decoration: none; margin-bottom: 28px;">
            Accept invitation
          </a>
          <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin: 0;">
            This invitation expires in 7 days.
            <br /><br />
            Or copy this link: <span style="color: #3b82f6;">${invitationUrl}</span>
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }

    return { success: true };
  },
});