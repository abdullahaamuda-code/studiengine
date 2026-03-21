# Prepwise — AI Study Tool for Nigerian Students

Turn lecture notes and past questions into interactive quizzes. Built for JAMB, WAEC, NECO, and university students.

## Features

1. **Notes → Quiz** — Paste notes or upload a PDF, get 10 MCQs instantly
2. **PQ Analyzer** — Paste past questions, get topic frequency, patterns, and revision strategy
3. **PQ → Quiz** — Convert actual past question text into an interactive quiz with answers + explanations

## Stack

- Next.js 14 (App Router)
- Groq API (llama-3.3-70b-versatile) — free tier
- Tailwind CSS
- pdfjs-dist for PDF text extraction
- No database — session-based only

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd prepwise
npm install
```

### 2. Get your free Groq API key

Go to [console.groq.com](https://console.groq.com) → sign up → create API key.
It's completely free.

### 3. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
GROQ_API_KEY=gsk_your_actual_key_here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel (Free)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import project
3. In **Environment Variables**, add:
   - Key: `GROQ_API_KEY`
   - Value: your Groq API key
4. Deploy — done.

The API key stays on Vercel's server. It never reaches the browser.

## Project Structure

```
prepwise/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   # Notes→Quiz and PQ→Quiz
│   │   └── analyze/route.ts    # PQ Analyzer
│   ├── globals.css             # Glassmorphism styles
│   ├── layout.tsx
│   └── page.tsx                # Main page
├── components/
│   ├── InputPanel.tsx          # Shared paste + PDF upload
│   ├── QuizPlayer.tsx          # Interactive quiz engine
│   ├── NotesTab.tsx
│   ├── PQAnalyzerTab.tsx
│   └── PQQuizTab.tsx
├── lib/
│   └── pdf.ts                  # PDF text extraction
└── .env.local.example
```
