# Multi-Tenant AI Collaboration SaaS

The companion source code for the freeCodeCamp tutorial **"Build a Multi-Tenant AI Collaboration SaaS with Next.js, Convex, Kinde, and Groq"**.

This is a production-ready application, not a demo. By the end of the tutorial you have a deployed platform where teams can create organizations, invite members, collaborate on rich-text documents, and run AI analysis — all with real auth, real-time sync, and a proper permission system enforced on every database operation.


## What's inside

**Authentication and user management** via [Kinde](https://kinde.com). OAuth login, webhook-based user sync to Convex, and JWT verification on every server-side operation.

**Multi-tenant organizations** with URL-based routing (`/org/[slug]`). Each organization is isolated — members only see their own data. Owners can create and delete the org. Admins manage members. Members create documents. Viewers read only.

**Invitation system** with email delivery via [Resend](https://resend.com). Token-based invitations with expiry, acceptance, and revocation. Invites work for both new and existing Kinde users.

**Role-based access control** enforced in [Convex](https://convex.dev), not in the UI. Four roles (owner, admin, member, viewer) backed by a permissions module that every mutation checks before touching the database.

**Rich-text document editor** built on [BlockNote](https://blocknotejs.org) — a Notion-style block editor with headings, lists, images, tables, code blocks, and slash commands. Documents auto-save with a debounce, store as JSON in Convex, and support image uploads directly to Convex file storage.

**AI analysis** via [Groq](https://console.groq.com). One-click document analysis using `llama-3.3-70b-versatile`. Results are written back to the document record and rendered in the UI. Rate limited per organization using the access log table.

**Cross-organization document sharing**. Org members can share individual documents with users outside the organization, with granular permissions (view, comment, edit). Shared documents appear in a dedicated dashboard.

**Live presence system**. See who is currently viewing a document. Presence records are written on focus and cleaned up by a [Convex cron job](https://docs.convex.dev/scheduling/cron-jobs) every five minutes.

**Version history**. Manual version saves with restore. Every restore creates a new version before overwriting, so nothing is lost.

**Security hardening**. Input validation with length limits on every mutation. Rate limiting on AI calls and invitation sends. Access log auditing. HTTP security headers. The document sharing model prevents external users from re-sharing access they received.

**Paginated data loading**. Document lists use [`usePaginatedQuery`](https://docs.convex.dev/database/pagination) so large organizations do not hit Convex's read limits. Error boundaries scope failures to individual components rather than blanking the whole page.


## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [Next.js 16](https://nextjs.org) (App Router) |
| Auth | [Kinde](https://kinde.com) |
| Backend / Database | [Convex](https://convex.dev) |
| AI | [Groq](https://console.groq.com) (`llama-3.3-70b-versatile`) |
| Email | [Resend](https://resend.com) |
| Rich Text Editor | [BlockNote](https://blocknotejs.org) |
| Deployment | [Vercel](https://vercel.com) + [Convex Cloud](https://convex.dev) |


## Project structure

```
├── app/
│   ├── api/auth/[kindeAuth]/     # Kinde OAuth handler
│   ├── dashboard/
│   │   ├── page.tsx              # Dashboard home, org switcher
│   │   ├── shared/               # Documents shared with me
│   │   └── error.tsx             # Dashboard error boundary
│   ├── invite/[token]/           # Invitation accept page
│   ├── org/[slug]/
│   │   ├── layout.tsx            # Org shell, sidebar, auth guard
│   │   ├── overview/             # Org overview with stats
│   │   ├── documents/
│   │   │   ├── page.tsx          # Paginated document list
│   │   │   └── [documentId]/     # Document editor with AI, versions, sharing
│   │   ├── members/              # Member management, invite UI
│   │   └── settings/             # Org settings, danger zone
│   ├── not-found.tsx
│   └── error.tsx
├── components/
│   ├── org-context.tsx           # Organization context provider
│   ├── org-sidebar.tsx           # Sidebar with org switcher
│   ├── document-editor.tsx       # BlockNote editor (client-only)
│   └── document-editor-dynamic.tsx  # Dynamic import wrapper for Next.js
├── convex/
│   ├── schema.ts                 # Full database schema
│   ├── http.ts                   # Kinde webhook handler
│   ├── crons.ts                  # Presence cleanup cron
│   ├── organizations.ts          # Org CRUD, member management
│   ├── documents.ts              # Document CRUD, paginated list
│   ├── documentShares.ts         # Cross-org sharing
│   ├── documentVersions.ts       # Version save and restore
│   ├── invitations.ts            # Invite create, accept, revoke
│   ├── presence.ts               # Presence heartbeat and query
│   ├── accessLogs.ts             # Audit log query (admin only)
│   ├── files.ts                  # Convex file storage helpers
│   ├── users.ts                  # User sync and lookup
│   ├── ai.ts                     # Analyze mutation (rate limited)
│   ├── actions/ai.ts             # Groq action (server-side)
│   └── lib/
│       ├── auth.ts               # getCurrentUser, requirePermission helpers
│       ├── permissions.ts        # ROLE_PERMISSIONS map
│       └── documentAccess.ts     # resolveDocumentAccess helper
├── lib/
│   └── use-delayed-loading.ts    # Spinner delay hook
└── custom.d.ts                   # CSS module type declarations
```


## Getting started

### Prerequisites

- Node.js 18 or later
- A [Convex](https://convex.dev) account
- A [Kinde](https://kinde.com) account
- A [Groq](https://console.groq.com) account
- A [Resend](https://resend.com) account
- A [Vercel](https://vercel.com) account (for deployment)

### 1. Clone and install

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
npm install
```

### 2. Set up Convex

```bash
npx convex dev
```

This creates your project in the [Convex dashboard](https://dashboard.convex.dev) and starts the local development server. Copy the deployment URL it prints — you need it for the next step.

### 3. Configure environment variables

Create `.env.local` in the project root:

```env
# Kinde — https://app.kinde.com
KINDE_CLIENT_ID=
KINDE_CLIENT_SECRET=
KINDE_ISSUER_URL=https://your-app.kinde.com
KINDE_SITE_URL=http://localhost:3000
KINDE_POST_LOGOUT_REDIRECT_URL=http://localhost:3000
KINDE_POST_LOGIN_REDIRECT_URL=http://localhost:3000/dashboard

# Convex — https://dashboard.convex.dev
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

Then set your server-side secrets in the [Convex dashboard](https://dashboard.convex.dev) under **Settings > Environment Variables**:

```
KINDE_DOMAIN     https://your-app.kinde.com
RESEND_API_KEY   re_xxxxxxxxxxxxxxxxxxxx   # https://resend.com/api-keys
GROQ_API_KEY     gsk_xxxxxxxxxxxxxxxxxxxx  # https://console.groq.com/keys
```

### 4. Configure Kinde

In your [Kinde dashboard](https://app.kinde.com) under **Settings > Applications > your app > URLs**, add:

- **Allowed callback URLs**: `http://localhost:3000/api/auth/kinde_callback`
- **Allowed logout redirect URLs**: `http://localhost:3000`

Under **Settings > Webhooks**, create a webhook pointing to your Convex HTTP endpoint:

```
https://your-deployment.convex.cloud/kinde
```

Select the `user.created` and `user.updated` event types. See the [Kinde webhook docs](https://docs.kinde.com/developer-tools/kinde-api/webhooks/) for more detail.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).


## Deployment

### Deploy Convex to production

```bash
npx convex deploy
```

Copy the production deployment URL. Set your production environment variables in the [Convex dashboard](https://dashboard.convex.dev) under the **Production** environment.

### Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables from `.env.local` in your [Vercel project settings](https://vercel.com/dashboard), replacing `localhost:3000` URLs with your production domain. Set `NEXT_PUBLIC_CONVEX_URL` to the production Convex URL from the step above.

Update your [Kinde application settings](https://app.kinde.com) to add your production domain to the allowed callback URLs and logout redirect URLs. Update the Kinde webhook URL to point at your production Convex deployment.

See the **Production Deployment** section of the tutorial for the full step-by-step checklist.


## Key documentation

- [Convex docs](https://docs.convex.dev) — database, queries, mutations, file storage, cron jobs
- [Kinde docs](https://docs.kinde.com) — OAuth setup, webhooks, JWT validation, user management
- [Kinde Next.js SDK](https://docs.kinde.com/developer-tools/sdks/backend/nextjs-sdk/) — App Router integration, route protection
- [Next.js docs](https://nextjs.org/docs) — App Router, dynamic routes, error boundaries
- [BlockNote docs](https://www.blocknotejs.org/docs) — editor setup, custom blocks, themes, file uploads
- [BlockNote Next.js guide](https://www.blocknotejs.org/docs/getting-started/nextjs) — SSR setup, dynamic imports
- [Groq API docs](https://console.groq.com/docs/openai) — models, rate limits, chat completions
- [Resend docs](https://resend.com/docs) — sending email, API keys, delivery logs
- [Vercel docs](https://vercel.com/docs) — deployment, environment variables, function logs
- [Convex pagination](https://docs.convex.dev/database/pagination) — `usePaginatedQuery`, cursors
- [Convex file storage](https://docs.convex.dev/file-storage) — upload URLs, serving files


## Tutorial

The full tutorial is published on freeCodeCamp: [link](#)

It covers every file in this repository from scratch, explaining the decisions behind the architecture rather than just the code.


## License

MIT