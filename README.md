# InterviewPilot AI

> AI-powered interview question and scorecard generator for hiring teams.

## Live Demo

- **Production:** https://interviewpilot-ai.vercel.app/

## Overview

InterviewPilot AI is an AI assistant focused on the **interview phase** of hiring. It helps HR teams and hiring managers run structured, fair, and repeatable interviews by generating tailored interview questions, evaluation criteria, and scorecards from a job description (and optionally a candidate profile).

### Why InterviewPilot AI?

- **Standardize interview quality** across different interviewers
- **Remove dependency** on individual interviewer skill
- **Provide structured, role-specific** interview questions
- **Clear "what to look for" guidance** with good signs and red flags
- **Consistent interview scorecards** for fair candidate evaluation

### Core MVP Features

- ✅ **Role Analysis** - Parse job descriptions and extract key requirements
- ✅ **Candidate Analysis** (Optional) - Analyze candidate resumes for personalized questions
- ✅ **Interview Question Generation** - Technical, behavioral, and culture-fit questions
- ✅ **Evaluation Criteria** - Good signs and red flags for each question
- ✅ **Scorecard Generation** - Structured evaluation categories with max scores
- ✅ **EN/JA Language Support** - Full bilingual support for UI and AI output
- ✅ **Stripe Integration** - Full subscription billing with Stripe Checkout and Customer Portal
- ✅ **User Dashboard** - Account settings with subscription management

## Tech Stack & Architecture

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + custom design tokens
- **Auth & Identity:** Supabase Auth (Google OAuth + Email/Password)
- **Backend:** Next.js Route Handlers (serverless functions)
- **AI:** OpenAI GPT-4o for role analysis, candidate analysis, and interview plan generation
- **Payments:** Stripe Checkout + Billing Portal for subscription management
- **i18n:** Simple JSON-based EN/JA translations with client-side context

High-level architecture:

- **Client (Next.js App Router)**
  - `/role`, `/candidate`, `/plan` as a 3-step flow
  - `/login` for Google + email/password auth
  - `/settings` for account information and (optional) deletion
- **API Routes**
  - `POST /api/role/analyze` → prompts OpenAI to extract a structured role profile
  - `POST /api/candidate/analyze` → extracts a candidate profile
  - `POST /api/interview/generate` → generates questions, good signs, red flags, and scorecard
  - `POST /api/account/delete` → deletes the current user via Supabase Admin API (service role key, server-only)
  - `POST /api/stripe/checkout` → creates Stripe Checkout session
  - `POST /api/stripe/webhook` → handles Stripe webhook events (subscription lifecycle)
  - `POST /api/stripe/portal` → creates Stripe Customer Portal session
  - `GET /api/stripe/subscription` → fetches user's subscription status
- **Data flow**
  - Role & candidate profiles are stored in `sessionStorage` between steps
  - Interview plan is computed on the server and rendered on `/plan`

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- OpenAI API key

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd interviewpilot-ai

# Install dependencies
npm install
# or
pnpm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (Required for auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Supabase service role key (Required only for account deletion API)
# IMPORTANT: never expose this key to the browser. It is used server-side only.
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe Configuration (Required for payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_xxx
STRIPE_SECRET_KEY=sk_live_or_sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Stripe Price IDs (from your Stripe Dashboard > Products)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx

# App URL (used for Stripe redirect URLs)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Setting up Stripe

1. Create a [Stripe account](https://stripe.com) and get your API keys
2. Create a Product in the Stripe Dashboard (e.g., "InterviewPilot Pro")
3. Add two Prices: monthly ($29) and yearly ($290)
4. Copy the Price IDs to your `.env.local`
5. Set up a Webhook endpoint pointing to `https://your-domain.com/api/stripe/webhook`
6. Subscribe to these events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
7. Configure the Customer Portal in Stripe Dashboard > Settings > Billing > Customer Portal

### Development

```bash
npm run dev
# or
pnpm dev
```

Open the app in your browser:

- Production: https://interviewpilot-ai.vercel.app/
- Local development: http://localhost:3000

### Build

```bash
npm run build
npm run start
```

## Usage Flow

1. **Role Setup** (`/role`)
   - Paste the job description
   - Optionally specify role title and experience level
   - Click "Next" to analyze

2. **Candidate Info** (`/candidate`) - Optional
   - Paste candidate resume or summary
   - Or skip to generate generic questions

3. **Interview Plan** (`/plan`)
   - View generated interview questions by category
   - Review good signs and red flags for each question
   - Use the scorecard for consistent evaluation

## Pricing & Business Model

InterviewPilot AI is designed as a B2B SaaS for hiring teams with a freemium model:

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0/month | 3 interview plans/month, basic features |
| **Pro** | $29/month ($290/year) | 50 interview plans/month, export, team sharing (up to 5 members) |
| **Team** | Custom | Unlimited plans, dedicated support, custom onboarding |

### Stripe Integration

- **Checkout**: Uses Stripe Checkout for secure payment collection
- **Billing Portal**: Customers can manage subscriptions, update payment methods, and view invoices
- **Webhooks**: Handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and invoice events
- **Trial Support**: Built-in support for trial periods and promotional codes

## Security & Auth Design

- **Authentication**
  - Supabase Auth with Google OAuth and Email/Password
  - Password reset via Supabase's `resetPasswordForEmail`
  - Account deletion endpoint (`/api/account/delete`) that calls Supabase Admin API server-side only
- **Key management**
  - `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are loaded from environment variables
  - `SUPABASE_SERVICE_ROLE_KEY` is used **only in server-side route handlers** and is never exposed to the client
  - `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are server-side only
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is safe for client-side use
- **Data**
  - This MVP does not persist interview data to a database; role/candidate/interview plan are stored in `sessionStorage` for the current browser session
  - This keeps the demo simple while still demonstrating how a production system would separate concerns (auth, AI, and UI)

## Project Structure

```
interviewpilot-ai/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── login/page.tsx      # Authentication page
│   ├── settings/page.tsx   # Account & subscription settings
│   ├── pricing/page.tsx    # Pricing plans page
│   ├── role/page.tsx       # Step 1: Job description input
│   ├── candidate/page.tsx  # Step 2: Candidate info (optional)
│   ├── plan/page.tsx       # Step 3: Generated interview plan
│   └── api/
│       ├── role/analyze/route.ts
│       ├── candidate/analyze/route.ts
│       ├── interview/generate/route.ts
│       ├── account/delete/route.ts
│       └── stripe/
│           ├── checkout/route.ts
│           ├── webhook/route.ts
│           ├── portal/route.ts
│           └── subscription/route.ts
├── components/
│   ├── layout/             # Header, LanguageToggle, AuthButton
│   ├── auth/               # ProtectedRoute, EmailAuthForm
│   └── ui/                 # Button, Card, TextArea, etc.
├── lib/
│   ├── openai.ts           # OpenAI client & helpers
│   ├── supabase.ts         # Supabase client
│   ├── stripe.ts           # Stripe server-side client
│   ├── stripe-client.ts    # Stripe client-side helpers
│   ├── auth.tsx            # Auth context & hooks
│   ├── i18n.ts             # Internationalization
│   └── utils.ts            # Utility functions
├── types/                  # TypeScript type definitions
├── locales/                # EN/JA translations
└── public/                 # Static assets
```

---

## 🇯🇵 日本語説明

### InterviewPilot AI とは？

InterviewPilot AI は、採用面接プロセスを支援するAIツールです。求人情報を入力するだけで、その職種に最適な面接質問、評価基準、スコアカードを自動生成します。

### 主な機能

- **求人情報の分析**: 求人票から必要なスキル、責任範囲、評価基準を自動抽出
- **候補者情報の活用**: 候補者の経歴を考慮した個別最適化された質問を生成（任意）
- **構造化された質問**: 技術的質問、行動面接質問、カルチャーフィット質問をカテゴリ別に生成
- **評価ガイダンス**: 各質問に対する「良い回答の特徴」と「注意すべきポイント」を提示
- **統一スコアカード**: 面接官間で一貫した評価を行うための評価シートを自動生成

### 使い方

1. `/role` ページで求人情報を貼り付け
2. `/candidate` ページで候補者情報を入力（スキップ可）
3. `/plan` ページで生成された面接プランを確認

言語は画面右上のトグルで日本語/英語を切り替えられます。AIの出力言語も連動して切り替わります。

---

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.



