# InterviewPilot AI

> AI-powered interview question and scorecard generator for HR teams.

## Overview

InterviewPilot AI is an AI assistant designed specifically for the **interview phase** of hiring. It helps HR teams and hiring managers standardize their interview process by generating tailored interview questions, evaluation criteria, and scorecards.

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

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (ready for future persistence)
- **AI:** OpenAI GPT-4o

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

# Supabase Configuration (Optional for MVP)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

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

## Project Structure

```
interviewpilot-ai/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   ├── role/page.tsx       # Step 1: Job description input
│   ├── candidate/page.tsx  # Step 2: Candidate info (optional)
│   ├── plan/page.tsx       # Step 3: Generated interview plan
│   └── api/
│       ├── role/analyze/route.ts
│       ├── candidate/analyze/route.ts
│       └── interview/generate/route.ts
├── components/
│   ├── layout/             # Header, LanguageToggle
│   └── ui/                 # Button, Card, TextArea, etc.
├── lib/
│   ├── openai.ts           # OpenAI client & helpers
│   ├── supabase.ts         # Supabase client
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



