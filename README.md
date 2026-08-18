# Bank Statement Converter

Convert bank statement PDFs to Excel in seconds. An AI-powered parser for Chase, Wells Fargo, Bank of America, Citi, Capital One, and 500+ banks.

## Tech stack

- **Next.js 16** (App Router, TypeScript, React 19)
- **Tailwind CSS v4** + shadcn-style UI components (owned in `components/ui`)
- **Supabase** (Postgres + Auth + Storage)
- **Anthropic Claude** (`claude-sonnet-4-20250514`) for transaction extraction
- **pdf-parse** for PDF text extraction, **xlsx** for Excel generation
- Deploys to **Vercel**

## Features

- Landing page with drag-and-drop upload area, supported banks, and 3 pricing tiers (Free / Pro / Business)
- Email + password and Google OAuth login
- `/upload` (auth-protected): upload progress, staged parsing animation, 10-row preview, one-click Excel download, monthly quota badge
- `/dashboard` (auth-protected): current plan + usage progress, full history table with per-row download, Upgrade CTA
- `/api/parse-statement`: downloads the PDF, extracts text, calls Claude, builds an Excel file, stores it, and decrements the user's monthly credits
- Middleware-protected routes, 10 MB file limit, PDF-only validation, per-user RLS on all tables and storage

## Prerequisites

1. A [Supabase](https://supabase.com) project
2. An [Anthropic](https://console.anthropic.com) API key
3. Node.js 20.16+ (or 22.3+) and npm

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 3. Set up the Supabase database

In your Supabase dashboard open **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](./supabase/schema.sql), and run it. This creates:

- `public.users` (plan, credits_remaining, credits_reset_date) linked to `auth.users`
- `public.statements` (file metadata, status, parsed_data, excel_url)
- RLS policies so users can only access their own rows
- A trigger that auto-creates a free profile (3 credits) on signup
- `statements` (private) and `exports` (public) storage buckets with matching policies

### 4. Enable Google OAuth (optional)

In Supabase: **Authentication → Providers → Google**, enable it, and add your OAuth client ID/secret. Set the redirect URL to `https://your-domain/auth/callback`.

### 5. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, then go to `/upload` and drop a PDF bank statement.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the same env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`) in **Project Settings → Environment Variables**.
4. In Supabase **Authentication → URL configuration**, add your Vercel domain to the allowed redirect URLs and site URL.
5. Deploy. The `/api/parse-statement` route is configured with `maxDuration = 60` — make sure your Vercel plan allows function durations up to 60s (Hobby caps at 10s; consider Pro for large statements).

## Project structure

```
app/
  page.tsx                      # Landing (hero, upload CTA, pricing, footer)
  login/page.tsx                # Email + Google auth, sign in / sign up
  upload/page.tsx               # Upload, parse states, preview, download
  dashboard/page.tsx            # Plan/usage, history (server component)
  auth/callback/route.ts        # OAuth code exchange
  api/parse-statement/route.ts  # Full parse pipeline
  privacy/page.tsx, terms/page.tsx
components/ui/                  # Button, Card, Input, Progress (owned shadcn-style)
lib/
  supabase/{client,server,middleware}.ts
  credits.ts                    # Plan limits + monthly reset logic
  utils.ts                      # cn(), formatUSD()
supabase/schema.sql             # DB + storage setup
middleware.ts                  # Protects /upload and /dashboard
```

## Notes & known limitations

- **Excel bucket is public-read.** Generated files are stored under `exports/{userId}/{statementId}.xlsx` — the path contains two UUIDs, so it's effectively unguessable. For stricter access, switch the `exports` bucket to private and issue signed URLs in the API instead of `getPublicUrl`.
- **`xlsx` advisory:** the npm `xlsx` package carries a known ReDoS advisory. For production you can replace it with the SheetJS CDN build (`npm install --save https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`).
- **Payments not included.** The Pro/Business CTAs and the "Upgrade to Pro" button route to the pricing section. Integrate Stripe Billing to actually gate paid plans.
- **Credits are decremented after a successful parse.** Failures (PDF parse error, AI error, storage error) leave the user's balance untouched and mark the statement `failed`.
```
