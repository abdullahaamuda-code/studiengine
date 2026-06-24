# Studiengine

> AI-powered CBT exam preparation for Nigerian students.

Studiengine helps secondary school and university entrance candidates prepare for **JAMB, WAEC, and NECO** through an intelligent, computer-based test (CBT) practice environment — complete with AI-driven feedback, topic analysis, and a subscription model built for the Nigerian market.

---

## Features

### Exam Practice
- CBT-style interface that mirrors the real exam experience
- Subject and topic selection across JAMB, WAEC, and NECO syllabi
- Timed practice sessions with auto-submission

### AI-Powered Review
- Per-question streaming explanations powered by **Groq**
- Post-session topic analysis to surface weak areas
- AI-generated performance insights using **Gemini**

### Subscriptions & Payments
- Integrated **Paystack** payment gateway
- Three flexible plans:
  | Plan | Price |
  |---|---|
  | Monthly | ₦600 |
  | Quarterly | ₦1,600 |
  | Annual | ₦6,000 |
- Async post-payment success polling for reliable plan activation

### Ambassador Program
- Referral tracking system for student ambassadors
- Dedicated ambassador dashboard with conversion and reward visibility

### Admin Panel
- 7-tab admin dashboard for full platform management
- User, subscription, question bank, and analytics oversight

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database & Auth | Firebase (Firestore + Firebase Auth) |
| AI — Review | Groq (streaming) |
| AI — Analysis | Google Gemini |
| Payments | Paystack |
| Styling | Inline styles, dark glassmorphism (`#080c14` base) |

---

## Design System

Studiengine uses a custom dark glassmorphism design language:

- **Background:** `#080c14` deep navy
- **Surface:** semi-transparent frosted glass cards
- **Accent:** electric blue / cyan highlights
- No Tailwind — all styling is done with inline styles for full control

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project (Firestore + Auth enabled)
- Paystack account (test or live keys)
- Groq API key
- Google Gemini API key

### Installation

```bash
git clone https://github.com/your-username/studiengine.git
cd studiengine
npm install
```

### Environment Variables

Create a `.env.local` file in the root of the project:

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# AI
GROQ_API_KEY=
GEMINI_API_KEY=
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
studiengine/
├── app/                  # Next.js App Router pages and layouts
│   ├── (auth)/           # Authentication routes
│   ├── (dashboard)/      # Student dashboard and exam flows
│   ├── admin/            # 7-tab admin panel
│   └── api/              # API routes (payments, AI, etc.)
├── components/           # Reusable UI components
├── lib/                  # Firebase config, utilities, helpers
├── hooks/                # Custom React hooks
└── public/               # Static assets
```

---

## Roadmap

- [ ] Offline mode for low-connectivity environments
- [ ] Mobile app (React Native / PWA)
- [ ] Expanded question bank (Post-UTME, BECE)
- [ ] Performance analytics dashboard for students
- [ ] Group/school licensing

---

## About

Studiengine was built to close the exam prep gap for Nigerian students — particularly those without access to expensive tutorials or coaching centres. The platform is designed to be affordable, intelligent, and accessible.

Built by **Abdullah** — Computer Engineering student, ABU Zaria & Airtel Africa Foundation Fellow.

---

## License

This project is proprietary. All rights reserved.
