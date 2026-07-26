# FinSight.ai

A production-focused financial intelligence template built with Next.js App Router, TypeScript, Tailwind CSS, Firebase, Recharts, Zod, Framer Motion, Lucide, and OpenAI.

## Safety architecture

FinSight separates language intelligence from financial computation:

- `lib/math-engine.ts` is the only projection and anomaly calculation layer.
- `lib/ai-engine.ts` only parses intent and narrates pre-calculated facts.
- Every AI scenario and fact passes through strict Zod validation.
- Narrative grounding rejects numbers not present in the source fact.
- OpenAI credentials remain server-only behind route handlers.

This is a software template, not financial advice.

## Start locally

1. Copy `.env.example` to `.env.local`.
2. Add OpenAI and Firebase credentials.
3. Run `npm run dev`.
4. Open `http://localhost:3000`.

Without Firebase credentials, the navbar clearly reports local demo mode. The initial dashboard and deterministic charts still work. OpenAI credentials are required only when a user submits a new natural-language scenario.

## Manual editing

The main demo workspace is intentionally centralized in:

- `lib/dashboard-data.ts`: copy, balance inputs, recurring expenses, anomaly baselines, and example questions.
- `app/globals.css`: semantic OKLCH color tokens, dark mode, radii, and elevation.
- `types/financial.ts`: domain contracts.
- `components/dashboard/`: independent dashboard sections.

Change values in `lib/dashboard-data.ts`; the cards, alerts, runway, and charts update from those inputs.
