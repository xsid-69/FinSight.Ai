# FInsightAI — Mobile Frontend

React Native (Expo SDK 57 + TypeScript) UI for FInsightAI, built to the finalized
BKT-inspired design: a white app with a red gradient header, a curved sheet that
tracks the active tab, pink-red gradient accents, and a notched bottom nav with a
floating action button.

> Scope: **UI frontend only.** No SMS listener, Firebase, OpenAI, or analytics
> logic — those are backend/service concerns and are intentionally excluded.

## Stack

- Expo SDK 57, React Native 0.86, React 19
- NativeWind v4 (Tailwind CSS for RN) for styling
- React Navigation (native-stack + bottom-tabs with a custom tab bar)
- `react-native-svg` for the curved header cap and nav notch
- `expo-linear-gradient` for the red / pink gradients
- `lucide-react-native` for icons

## Run

```bash
cd finsight
npm install        # if not already installed
npx expo start     # then press a (Android) / i (iOS) or scan the QR in Expo Go
```

## Screens

- **Onboarding** (`src/screens/OnboardingScreen.tsx`) — tilted dark card, gradient CTA.
- **My finance** (`src/screens/MyFinanceScreen.tsx`) with three top tabs:
  - **Overview** (`src/screens/tabs/OverviewTab.tsx`) — request cards, balances, accounts.
  - **Transactions** (`src/screens/tabs/TransactionsTab.tsx`) — categories, search, grouped feed.
  - **Budget** (`src/screens/tabs/BudgetTab.tsx`) — spend card + category progress.
- **Payments** / **Products** — branded placeholders.

## Key UI building blocks

- `src/components/SheetCap.tsx` — SVG white sheet cap; its dome/peak tracks the active tab.
- `src/components/BottomTabBar.tsx` — custom nav with an SVG concave notch + floating FAB.
- `src/components/ScreenScaffold.tsx` — red header + tabs + curved sheet + scroll body.
- `src/components/Money.tsx` — split-decimal ₹ amounts (large integer, muted decimals).
- `src/theme/tokens.ts` + `tailwind.config.js` — the color/spacing design tokens.
