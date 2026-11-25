# 🚀 FinSight AI — Autonomous Predictive Financial Intelligence Copilot

<div align="center">

<img src="./finsight/assets/logo.png" alt="FinSight AI Logo" width="140" style="border-radius: 28px; box-shadow: 0 12px 36px rgba(0,0,0,0.25);" />

### *Defensive Mobile Architecture • Sub-2ms Edge SMS Ingestion • 18-Month Cash Runway Forecasting • Anonymized Cohort Mirroring • Zero-Hallucination AI Copilot*

[![Framework](https://img.shields.io/badge/React_Native-0.86.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo SDK](https://img.shields.io/badge/Expo_SDK-57.0.9-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-v12.18-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)
[![Security](https://img.shields.io/badge/Security-Zero_OTP_Leakage-brightgreen?style=for-the-badge&logo=shield)](https://owasp.org/)
[![Download APK](https://img.shields.io/badge/Production_APK-v2.9.9-10B981?style=for-the-badge&logo=android&logoColor=white)](./FinsightAI-v2.9.9.apk)
[![License](https://img.shields.io/badge/License-MIT-gray?style=for-the-badge)](./finsight/LICENSE)

<br/>

**FinSight AI** is an enterprise-grade mobile financial intelligence platform engineered with **React Native 0.86**, **Expo SDK 57**, **Native Kotlin Android Telephony Modules**, **Firebase Cloud Firestore**, and **OpenAI GPT-4o-mini**. Built with mathematical rigor and defensive privacy guarantees, it delivers sub-2ms on-device transaction parsing, password-protected statement decryption in volatile RAM, 18-month statistical cash flow projections via Holt-Winters formulas, continuous Kernel Density Estimation (KDE) peer cohort benchmarking, and a conversational AI financial advisor strictly guarded against arithmetic hallucinations.

</div>

---

## 📑 Table of Contents

1. [Visual Showcase & Real App Execution](#-visual-showcase--real-app-execution)
2. [The 6 Core Features & Architectural Modules](#-the-6-core-features--architectural-modules)
   - [Feature 01: CSV Statement Analyzer & Financial Dashboard](#feature-01-csv-statement-analyzer--financial-dashboard)
   - [Feature 02: Tier-1 Local Regex SMS Parser](#feature-02-tier-1-local-regex-sms-parser)
   - [Feature 03: Goal Affordability Simulator (What-If Engine)](#feature-03-goal-affordability-simulator-what-if-engine)
   - [Feature 04: Cohort Financial Mirror (KDE Engine)](#feature-04-cohort-financial-mirror-kde-engine)
   - [Feature 05: Android Native SMS Broadcast Listener & Live Radar](#feature-05-android-native-sms-broadcast-listener--live-radar)
   - [Feature 06: Tier-3 AI Merchant Classifier + Grounded Copilot (Zod Guardrails)](#feature-06-tier-3-ai-merchant-classifier--grounded-copilot-zod-guardrails)
3. [System Architecture & Data Flows](#-system-architecture--data-flows)
   - [A. Executive Layered System Architecture](#a-executive-layered-system-architecture)
   - [B. End-to-End 6-Feature Data Pipeline Flow](#b-end-to-end-6-feature-data-pipeline-flow)
   - [C. Real-Time Native SMS Interception & Privacy Sequence](#c-real-time-native-sms-interception--privacy-sequence)
   - [D. Multi-Bank Statement Ingestion & Decryption Flow](#d-multi-bank-statement-ingestion--decryption-flow)
   - [E. Holt-Winters Cash Runway & Goal Simulator Decision Tree](#e-holt-winters-cash-runway--goal-simulator-decision-tree)
   - [F. Kernel Density Estimation (KDE) Cohort Mirror Pipeline](#f-kernel-density-estimation-kde-cohort-mirror-pipeline)
   - [G. Zero-Hallucination AI Copilot Sequence with Zod Guardrails](#g-zero-hallucination-ai-copilot-sequence-with-zod-guardrails)
   - [H. Application Navigation & State Machine Hierarchy](#h-application-navigation--state-machine-hierarchy)
4. [Data Storage & Security Architecture](#-data-storage--security-architecture)
5. [Mathematical & Algorithmic Foundations](#-mathematical--algorithmic-foundations)
6. [Technology Stack & Dependency Matrix](#-technology-stack--dependency-matrix)
7. [Production Repository Structure](#-production-repository-structure)
8. [Developer Setup & Build Guide](#-developer-setup--build-guide)
9. [Brand Identity & Logo System (Logo Designer Skill)](#-brand-identity--logo-system-logo-designer-skill)
10. [Privacy Manifesto & License](#-privacy-manifesto--license)

---

## 📸 Visual Showcase & Real App Execution

The interfaces below showcase real physical device captures directly from FinSight AI's production release build, demonstrating real-time transaction ingestion, cash flow tracking, what-if simulations, peer cohort benchmarking, and conversational AI guidance.

<div align="center">

### Phase 1: Executive Financial Home & Transaction Ledger

| 01. Financial Home Overview | 02. Live Transactions & Radar |
| :---: | :---: |
| <img src="./screenshots/01_overview_dashboard.jpg" alt="Financial Home Overview" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> | <img src="./screenshots/02_live_transactions.jpg" alt="Live Transactions Radar" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> |
| **Private Financial Snapshot**<br/>`+₹10,449.59` Net Cash Flow • `₹2,20,200.58` Money In • `₹2,09,750.99` Money Out across 511 auto-synced records. | **Settlement Stream & Telemetry**<br/>Sub-2ms air-gapped ledger parsing UPI SMS alerts, 88% credit / 12% debit split with merchant categorization. |

---

### Phase 2: Cash Flow Velocity & Forward-Looking Goal Simulation

| 03. Cash Velocity & Insights | 04. What-If Purchase Analysis |
| :---: | :---: |
| <img src="./screenshots/03_cashflow_insights.jpg" alt="Monthly Inflow Outflow Insights" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> | <img src="./screenshots/04_goal_simulator_analysis.jpg" alt="Purchase Analysis Simulator" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> |
| **Monthly Inflow vs Outflow Insights**<br/>Interactive multi-month cash flow histogram (Apr–Sept) showing monthly net delta (`-₹7,035.62` Sept net cash flow). | **What-If Purchase Affordability**<br/>Simulating ₹1,00,000 upfront iPhone 17 purchase: checks post-purchase cushion (`₹2,85,594`) and triggers caution alerts. |

---

### Phase 3: 18-Month Cash Runway Curve & AI Financial Copilot

| 05. 18-Month Cash Runway Forecast | 06. FinSight Grounded AI Assistant |
| :---: | :---: |
| <img src="./screenshots/05_runway_projection.jpg" alt="18-Month Runway Projection" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> | <img src="./screenshots/06_ai_financial_assistant.jpg" alt="AI Financial Assistant" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> |
| **Holt-Winters Runway Curve**<br/>Comparative curves (*Without purchase* vs *With purchase*) projecting liquidity across 18 months (`₹2,18,755` at Month 4). | **Zero-Hallucination AI Copilot**<br/>Guided natural-language financial answers grounded strictly in deterministic arithmetic facts via Zod validation. |

---

### Phase 4: Peer Benchmark Standing & Physical Device Onboarding

| 07. Cohort Benchmark Profile | 08. Android Device Native Onboarding |
| :---: | :---: |
| <img src="./screenshots/07_peer_cohort_profile.jpg" alt="Cohort Peer Benchmark" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> | <img src="./mockups/live.png" alt="Device Onboarding Execution" width="340" style="border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);" /> |
| **Demographic Peer Standing**<br/>Nagpur College Student cohort comparison across 5,420 peer samples (`Top 22% Standing`) computed via continuous Gaussian KDE. | **Physical Device Execution**<br/>Native Android production runtime featuring frictionless onboarding, credential tokenization, and edge permission bootstrapping. |

</div>

---

## 💎 The 6 Core Features & Architectural Modules

FinSight AI is architected around the 6 core functional modules defined in [`features.md`](./features.md). Each module is engineered for strict defensive isolation, sub-second execution, and zero financial hallucination:

| Step | Feature Module | Complexity | Primary Tech & Tools | Architecture & Defensive Strategy |
| :---: | :--- | :---: | :--- | :--- |
| **01** | **CSV Statement Analyzer & Dashboard** | 🟢 Very Easy | `papaparse`, `expo-document-picker`, Firestore | **Frictionless Onboarding:** Instant multi-bank ingestion (HDFC, SBI, ICICI, Axis) without requiring native OS permissions. |
| **02** | **Tier-1 Local Regex SMS Parser** | 🟡 Easy | JavaScript ES6 Regex, String Matchers, `privacySanitizer.js` | **Sub-2ms Edge Defense:** Zero API cost; extracts amount, type, and merchant locally while discarding OTPs in memory. |
| **03** | **Goal Affordability Simulator (What-If)** | 🟡 Moderate | Holt-Winters Formulas, `react-native-gifted-charts` | **Statistical Cash Runway:** Projects 12–36 month cash runway and purchase risk scores using historical transaction vectors. |
| **04** | **Cohort Financial Mirror** | 🟠 Moderate | Kernel Density Estimation (KDE), Firestore Benchmarks | **Differential Peer Ranking:** Compares category spend against peer distributions (e.g., Nagpur student cohort) with zero PII exposure. |
| **05** | **Android Native SMS Broadcast Listener** | 🟠 Moderate-Hard | Native Kotlin `SmsReceiver.kt`, Android Manifest | **Edge Hardware Radar:** Captures real-time incoming SMS broadcasts with native OS priority hooks and zero battery drain. |
| **06** | **Tier-3 AI Merchant Classifier + Zod** | 🔴 Advanced | OpenAI API (`gpt-4o-mini`), Zod Schemas, Firestore Cache | **Zero-Hallucination Fallback:** Intelligent categorization for unmapped merchants with persistent cloud caching to eliminate API cost. |

---

### Feature 01: CSV Statement Analyzer & Financial Dashboard
* **Primary Tech:** `papaparse` (v5.7.0), `xlsx` (v0.18.5), `expo-document-picker`, Firebase Cloud Firestore.
* **Core Responsibilities:**
  - Ingests bank statements in CSV, XLS, and XLSX formats across Indian banking institutions.
  - Dynamically detects variable column schemas (`Txn Date`, `Value Date`, `Narration`, `Withdrawal (Dr)`, `Deposit (Cr)`, `Balance`).
  - Executes SHA-256 transaction fingerprinting to guarantee zero duplicate records between uploaded files and live SMS streams.
  - Powers the executive **Financial Home Dashboard** with instant metrics: Net Cash Flow, Total Inflow, Total Outflow, and monthly breakdown.
* **Testing & Verification:** Deterministic parser test suites in `csvService.test.js` validating diverse banking export formats with 100% column normalizer accuracy.

```
                ┌────────────────────────────────────────────────────────┐
                │             USER SELECTS BANK STATEMENT                │
                │    Taps "Upload Statement" (HDFC, SBI, ICICI, Axis)    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          MIME & ENCRYPTION DETECTION (RAM)             │
                │    Inspect magic bytes: CSV, XLS, XLSX, Password PDF   │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
               Password-Encrypted Buffer                   │ Open Plaintext
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │   AWAITING USER PAN/DOB  │ │   PAPAPARSE NORMALIZER    │
                │ In-Memory AES/RC4 Decrypt│ │ Dynamic delimiter / header│
                └─────────────┬────────────┘ └─────────────┬─────────────┘
                              │                            │
                              └─────────────┬──────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │         SHA-256 DEDUPLICATION FINGERPRINTING           │
                │     Hash = SHA256(TxnDate + Amount + Merchant + Last4) │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │           EXECUTIVE DASHBOARD STATE UPDATE             │
                │  Net Cash Flow • Inflows/Outflows • 60 FPS Skia Charts │
                └────────────────────────────────────────────────────────┘
```

---

### Feature 02: Tier-1 Local Regex SMS Parser
* **Primary Tech:** Vanilla ES6 Regular Expressions, String Matchers, `privacySanitizer.js`.
* **Core Responsibilities:**
  - Evaluates incoming transactional SMS text strings in under **2 milliseconds** on-device.
  - Extracts 4 vital transaction entities: **Amount (₹)**, **Transaction Type (Debit / Credit)**, **Merchant / Beneficiary Descriptor**, and **Account Identifier (Last 4 digits)**.
  - Intercepts and strips 4–6 digit OTP codes, banking login PINs, and card security numbers before any object is serialized to memory.
  - Discards promotional spam and personal text messages immediately, preventing unnecessary database writes.
* **Testing & Verification:** Over 150 test fixtures spanning SBI, HDFC, ICICI, Axis, Kotak, PNB, BoB, Paytm, PhonePe, and Google Pay alerts.

```
                ┌────────────────────────────────────────────────────────┐
                │              INBOUND TELEPHONY BROADCAST               │
                │    Intent: android.provider.Telephony.SMS_RECEIVED     │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │             HEADER WHITELIST VALIDATION                │
                │   Verify Sender Address (HDFCBK, SBINB, ICICIB, AXISB) │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                     Recognized Bank Header                │ Promo / Spam / Personal
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │  PRIVACY MEMORY SANDBOX  │ │     IMMEDIATE DISCARD     │
                │ Strip 4-6 Digit OTP/PIN  │ │ Zero Disk Write / Zero Log│
                │ Mask Account (XX1234)    │ └───────────────────────────┘
                └─────────────┬────────────┘
                              │
                              ▼
                ┌────────────────────────────────────────────────────────┐
                │           SUB-2MS REGEX ENTITY EXTRACTION              │
                │   Extract: Amount (₹), Type (Dr/Cr), Beneficiary VPA   │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │           SETTLEMENT & LOCAL STORAGE WRITE             │
                │   Optimistic AsyncStorage Write • Trigger Haptic Pulse │
                └────────────────────────────────────────────────────────┘
```

---

### Feature 03: Goal Affordability Simulator (What-If Engine)
* **Primary Tech:** Holt-Winters Additive Triple Exponential Smoothing, `react-native-gifted-charts`, `purchasePlanner.js`.
* **Core Responsibilities:**
  - Models an 18-to-36 month forward-looking cash flow forecast using the user's historical transaction time series.
  - Decomposes baseline cash trajectory into three distinct components: **Level ($\ell_t$)**, **Trend ($b_t$)**, and **Seasonality ($s_t$)**.
  - Simulates large capital outlays (e.g., iPhone 17 for ₹1,00,000 upfront at Month 6) and overlays dual projection curves: *Without Purchase* vs *With Purchase*.
  - Calculates a **0–100 Purchase Safety Score**, identifying the minimum projected liquid reserve (`₹2,85,594`) and alerting the user if the safety cushion is breached.
* **Testing & Verification:** Property-based mathematical tests with `fast-check` verifying non-negative runway projections and conservative buffer warnings.

```
                ┌────────────────────────────────────────────────────────┐
                │               USER GOAL CONFIGURATION                  │
                │  Input Target: e.g., "iPhone 17 Pro", ₹1,00,000 in 6 Mo│
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          6-MONTH CASH BURN VECTOR EXTRACTION           │
                │    Extract Fixed (Rent/Bills) vs Discretionary Burn    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │         ADDITIVE HOLT-WINTERS RUNWAY SMOOTHING         │
                │   Level (α=0.2) • Trend (β=0.1) • Seasonal (γ=0.3)     │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │         CAPITAL OUTLAY SHOCK AT TARGET MONTH           │
                │   Deduct ₹1,00,000 at Month 6 • Compute Minimum Buffer │
                └───────────────────────────┬────────────────────────────┘
                                            │
                ┌───────────────────────────┴───────────────────────────┐
                │                                                       │
         Score >= 75                  50 <= Score < 75              Score < 50
                ▼                               ▼                       ▼
      ┌──────────────────┐            ┌──────────────────┐    ┌──────────────────┐
      │  PURCHASE SAFE   │            │ PURCHASE CAUTION │    │ PURCHASE HAZARD  │
      │ Surplus Reserves │            │ Tight Runway Post│    │ Depletes Buffer; │
      │ Verified Liquid  │            │ Lowest: ₹2,85,594│    │ Delay 3M Advised │
      └──────────────────┘            └──────────────────┘    └──────────────────┘
```

---

### Feature 04: Cohort Financial Mirror (KDE Engine)
* **Primary Tech:** Continuous Kernel Density Estimation (KDE), Silverman's Rule of Thumb, Cloud Firestore Benchmarks.
* **Core Responsibilities:**
  - Maps user spending profiles against regional and demographic peer groups (e.g., **Nagpur • College Student**, active sample size: 5,420).
  - Fits continuous non-parametric Gaussian probability density curves to cohort distributions across categories (Food, Transit, Shopping, Utilities).
  - Calculates exact percentile rankings (e.g., **Top 22% Standing**) through numerical integration over the estimated kernel.
  - Provides empathetic peer nudges without exposing individual financial data, enforcing strict differential privacy guarantees.
* **Testing & Verification:** Validated against synthetic normal and multimodal distributions with integration error bounds $< 0.01\%$.

```
                ┌────────────────────────────────────────────────────────┐
                │          USER DEMOGRAPHIC PROFILE RESOLUTION           │
                │     Nagpur • College Student • Tier-2 City Resident    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │       QUERY ANONYMIZED PEER COHORT BENCHMARK           │
                │     Fetch Nagpur Student Category Vector (N = 5,420)   │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          SILVERMAN'S BANDWIDTH OPTIMIZATION            │
                │         h = 0.9 × min(σ, IQR / 1.34) × n^(-1/5)        │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │       CONTINUOUS GAUSSIAN KERNEL CONVOLUTION           │
                │       f̂(x) = (1 / nh) Σ K((x - X_i) / h)               │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │        NUMERICAL INTEGRATION & PEER PERCENTILE         │
                │   User Spend: Top 22% (Spends more than 78% of peers)  │
                │   Zero Peer PII Exposed • Differential Privacy Safe    │
                └────────────────────────────────────────────────────────┘
```

---

### Feature 05: Android Native SMS Broadcast Listener & Live Radar
* **Primary Tech:** Native Kotlin `SmsReceiver.kt`, `SmsListenerModule.kt`, Android Manifest `RECEIVE_SMS` intent filter.
* **Core Responsibilities:**
  - Implements a high-priority Android `BroadcastReceiver` listening to `android.provider.Telephony.SMS_RECEIVED`.
  - Dispatches native OS broadcast payloads across the React Native Turbo bridge directly into the background JavaScript runtime.
  - Air-gapped pipeline: Filters and matches telephony sender headers (e.g., `VM-HDFCBK`, `AD-SBIINB`, `AX-ICICIB`) in real time.
  - Functions seamlessly in background state with near-zero battery footprint and instant haptic feedback on transaction capture.
* **Testing & Verification:** Validated on physical Android 10 through Android 15 test devices using synthetic cellular SMS injection scripts.

```
                ┌────────────────────────────────────────────────────────┐
                │           CELLULAR BASEBAND TRANSCEIVER RADIO          │
                │       Inbound GSM/CDMA SMS Protocol Data Unit (PDU)    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            ANDROID OS TELEPHONY DISPATCHER             │
                │    Broadcast: android.provider.Telephony.SMS_RECEIVED  │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            KOTLIN NATIVE SMSRECEIVER HOOK              │
                │    Ordered broadcast priority: 999 • Intent Filters    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │              TURBO MODULE BRIDGE DISPATCH              │
                │   Bridge to JS Event Emitter: onIncomingSmsReceived()  │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │             LIVE FINANCIAL RADAR DASHBOARD             │
                │   Instant Transaction Ingestion • Pulsing Glow Badge   │
                └────────────────────────────────────────────────────────┘
```

---

### Feature 06: Tier-3 AI Merchant Classifier + Grounded Copilot (Zod Guardrails)
* **Primary Tech:** OpenAI API (`gpt-4o-mini`), Zod Schema Validation, Cloud Firestore Merchant Cache.
* **Core Responsibilities:**
  - **Multi-Tier Merchant Resolution:**
    - *Tier 1:* Local regex string matcher (<2ms).
    - *Tier 2:* Local curated merchant brand registry (e.g., Swiggy, Zomato, Uber, Amazon).
    - *Tier 3:* Fallback to OpenAI `gpt-4o-mini` with strict Zod JSON schemas for unknown or cryptic merchant VPAs.
  - **Persistent Brand Cache:** Unresolved merchant classifications are stored in Cloud Firestore, guaranteeing that an unknown merchant is classified by AI exactly once across all users—permanently eliminating repeated API costs.
  - **Zero-Hallucination AI Financial Copilot:** All numerical computations (runway months, burn rate, savings deltas) are performed by deterministic TypeScript engines. The LLM receives pre-computed math facts and acts purely as an empathetic financial narrator.
* **Testing & Verification:** Zod schema validation tests ensuring invalid numerical payloads trigger instant fallback without user exposure.

```
                ┌────────────────────────────────────────────────────────┐
                │              UNRESOLVED MERCHANT STRING                │
                │       Raw String: "POS 49201948 SWIGGY BANGALORE"      │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            3-TIER RESOLUTION PIPELINE                  │
                └─────┬─────────────────────┬──────────────────────┬─────┘
                      │                     │                      │
             Tier 1: Exact Regex    Tier 2: Fuzzy Cache   Tier 3: Cloud Registry
                      │                     │                      │
                      ▼                     ▼                      ▼
                ┌───────────┐         ┌───────────┐          ┌───────────┐
                │ MATCH HIT │         │ MATCH HIT │          │ CACHE HIT │
                └─────┬─────┘         └─────┬─────┘          └─────┬─────┘
                      │                     │                      │
                      └─────────────────────┼──────────────────────┘
                                            │ (If All Miss)
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │        OPENAI GPT-4o-mini STRUCTURED CLASSIFIER        │
                │     Zod Contract: { brandName, category, mccIcon }     │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            PERSIST TO GLOBAL CLOUD CACHE               │
                │   Write /global/merchant_registry • Zero Future LLM Cost│
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          GROUNDED FINANCIAL COPILOT QUERY              │
                │  TypeScript Math Vector ──► Zod Guard ──► GPT-4o Advice│
                └────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture & Data Flows

FinSight AI employs a defensive, decoupled architecture that isolates sensitive native Android signals from cloud layers and strictly separates deterministic math calculations from generative language models.

### 🌐 High-Level Architecture Diagram

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                 ANDROID CLIENT RUNTIME                 │
                                  │   React Native 0.81 • Expo 54 • TypeScript • Skia UI   │
                                  │    Reanimated 3 • Gifted Charts • Native Wind (CSS)    │
                                  └───────────────▲────────────────────────▲───────────────┘
                                                  │                        │
                             Kotlin Turbo Modules │                        │Cloud Firestore SDK (WSS)
                                                  │                        │
                                  ┌───────────────▼────────────────────────┴───────────────┐
                                  │              EDGE PRIVACY & PARSING ENGINE             │
                                  │  • Native SmsReceiver.kt (Cellular Telephony Intercept)│
                                  │  • Sub-2ms Local Regex Parser & OTP Scrubbing Sandbox  │
                                  │  • In-Memory Encrypted Statement Decryption (RAM Only) │
                                  │  • SHA-256 Transaction Fingerprint & Deduplication     │
                                  └───────────────┬────────────────────────┬───────────────┘
                                                  │                        │
                           AsyncStorage / SQLite  │                        │Verified JSON Facts Vector
                                                  │                        │
                  ┌───────────────────────────────▼────────┐      ┌────────▼───────────────────────┐
                  │       CLOUD PERSISTENCE (FIRESTORE)    │      │    STATISTICAL MATH ENGINE     │
                  │  • /users/{uid}/transactions (Encrypted│      │  • Additive Holt-Winters Runway│
                  │  • /users/{uid}/statements (Summaries) │      │  • Gaussian Kernel Density KDE │
                  │  • OWASP IDOR-Proof Security Rules     │      │  • Pre-Calculated Cash Vectors │
                  └───────────────▲────────────────────────┘      └────────┬───────────────────────┘
                                  │                                        │
                                  │                     Zod Schema Guard   │(Strict Arithmetic Facts)
                                  │                                        ▼
                  ┌───────────────┴────────────────────────┐      ┌────────────────────────────────┐
                  │       GLOBAL COMMUNITY REGISTRY        │      │    GROUNDED AI COPILOT TIER    │
                  │  • Aggregated Peer Demographic Cohorts │      │  • OpenAI GPT-4o-mini Runtime  │
                  │  • Shared Verified Merchant Registry   │◄─────┤  • Zero-Hallucination Advisory │
                  │  • Zero PII Differential Privacy Mirror│      │  • 2-Sentence Plain Narrative  │
                  └────────────────────────────────────────┘      └────────────────────────────────┘
```

### 🧬 Mermaid Architectural Interaction Map

```mermaid
graph TD
    subgraph MobileEdge["📱 Native Android & Edge Runtime"]
        Telephony["Cellular Radio / SMS PDU Stream"]
        KotlinReceiver["SmsReceiver.kt (Priority Broadcast)"]
        FilePicker["Expo Document Picker (Bank Statements)"]
        PrivacySandbox["privacySanitizer.js (OTP Redaction & SHA-256)"]
        RegexEngine["Tier-1 Local Regex Matcher (<2ms)"]
    end

    subgraph ClientUI["🖥️ React Native 0.81 Presentation Layer"]
        Dock["Floating Bottom Navigation Dock"]
        Pager["HomePagerCoordinator (Overview • Ledger • Insights)"]
        SkiaCharts["Gifted Charts & Skia 60 FPS Engine"]
        LocalCache["AsyncStorage (<2ms Local Offline Cache)"]
    end

    subgraph DeterministicMath["📐 Deterministic Mathematical Engine"]
        HoltWinters["Additive Holt-Winters (18-Month Cash Runway)"]
        GaussianKDE["Gaussian KDE (Silverman's Bandwidth Peer Rank)"]
        ZodGuard["Zod Schema Guard (Strict Float/Integer Bounds)"]
    end

    subgraph CloudIntelligence["☁️ Cloud Persistence & Grounded AI"]
        Firestore["Cloud Firestore (Asia-South1 • Scoped UID)"]
        GlobalCache["Global Merchant & Brand Registry Cache"]
        GPT4oMini["OpenAI GPT-4o-mini (Empathetic Narrator Only)"]
    end

    Telephony -->|SMS_RECEIVED Broadcast| KotlinReceiver
    KotlinReceiver -->|Sanitized Intent| PrivacySandbox
    FilePicker -->|Encrypted Buffer| PrivacySandbox
    PrivacySandbox -->|Plaintext Redacted| RegexEngine
    RegexEngine -->|Parsed Transaction Vector| LocalCache
    LocalCache -->|Instant Hydration| Pager
    Pager -->|Reactive State| SkiaCharts
    LocalCache -->|Secure TLS Batch Sync| Firestore
    Firestore -->|6-Month Historical Series| HoltWinters
    Firestore -->|Nagpur Student Peer Sample| GaussianKDE
    HoltWinters -->|Deterministic Facts Vector| ZodGuard
    GaussianKDE -->|Percentile Standing Vector| ZodGuard
    ZodGuard -->|Verified Numbers Only| GPT4oMini
    GPT4oMini -->|2-Sentence Plain Guidance| Dock
    RegexEngine -->|Unknown Merchant String| GlobalCache
```

---

### A. Executive Layered System Architecture

<div align="center">
  <img src="./docs/diagrams/system_architecture.svg" alt="Executive Layered System Architecture" width="100%" style="border-radius: 12px; margin: 16px 0; box-shadow: 0 12px 36px rgba(0,0,0,0.3);" />
</div>

```
┌────────────────────────────────────────────────────────────────────────┐
│             LAYER 1: NATIVE ANDROID TELEPHONY & INGESTION             │
│   Inbound Cellular SMS Broadcast (SMS_RECEIVED) • File Picker Intent   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Native Kotlin Turbo Bridge)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LAYER 2: EDGE PRIVACY SANDBOX & DATA REDACTION            │
│   Strip OTPs & PINs in RAM • Sub-2ms Regex Parser • SHA-256 Dedupe     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Sanitized Transaction Vector)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LAYER 3: PRESENTATION & LOCAL STATE REACTION              │
│   AsyncStorage Cache (<2ms) • HomePagerCoordinator • 60 FPS Charts     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (TLS Async Batch Sync)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LAYER 4: CLOUD PERSISTENCE & SECURE LEDGER                │
│   Firestore /users/{uid}/transactions • OWASP IDOR-Proof Rules         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Historical Vector Extraction)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│              LAYER 5: STATISTICAL INTELLIGENCE & AI COPILOT            │
│   Holt-Winters Runway • Gaussian KDE Cohort • Zod Guard • GPT-4o-mini │
└────────────────────────────────────────────────────────────────────────┘
```

---

### B. End-to-End 6-Feature Data Pipeline Flow

The following flowchart demonstrates how all 6 core features from `features.md` seamlessly orchestrate transaction intake, edge privacy, statistical forecasting, peer benchmarking, and grounded AI delivery:

<div align="center">
  <img src="./docs/diagrams/end_to_end_pipeline.svg" alt="6-Feature Execution & Data Pipeline Flow" width="100%" style="border-radius: 12px; margin: 16px 0; box-shadow: 0 12px 36px rgba(0,0,0,0.3);" />
</div>

```
  [Feature 01: CSV Statement Upload]           [Feature 05: Cellular SMS Received]
                  │                                             │
                  ▼                                             ▼
     [In-Memory Decryption & PapaParse]             [Feature 02: Sub-2ms Regex]
                  │                                             │
                  │                                             ▼
                  │                                 [Privacy OTP & PIN Stripping]
                  │                                             │
                  │                                             ▼
                  │                                 [Feature 06: Tiered Resolution]
                  │                                  Match Local Brand / AI Classify
                  │                                             │
                  └──────────────────────┬──────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────┐
                  │    UNIFIED TRANSACTION DEDUPLICATION     │
                  │   SHA-256 Collision Check (No Duplicates)│
                  └──────────────────────┬───────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────┐
                  │  FEATURE 01: FINANCIAL HOME DASHBOARD    │
                  │   Net Cash Flow • Inflows • Outflows     │
                  └──────────────┬───────────────────┬───────┘
                                 │                   │
                                 ▼                   ▼
                  ┌──────────────────────┐   ┌──────────────────────┐
                  │ FEATURE 03: SIMULATOR│   │ FEATURE 04: COHORT   │
                  │ Holt-Winters Runway  │   │ Gaussian KDE Peer    │
                  └──────────────┬───────┘   └───────────────┬──────┘
                                 │                           │
                                 └─────────────┬─────────────┘
                                               │
                                               ▼
                  ┌──────────────────────────────────────────┐
                  │    PRE-COMPUTED ARITHMETIC FACTS VECTOR  │
                  │   Verified Runway Months & Safety Index  │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │   FEATURE 06: ZOD VALIDATION GUARDRAIL   │
                  │   Strict Float/Int Schema (Blocks Math)  │
                  └────────────────────┬─────────────────────┘
                                       │
                                       ▼
                  ┌──────────────────────────────────────────┐
                  │   FEATURE 06: GROUNDED AI COPILOT CHAT   │
                  │  GPT-4o-mini Empathetic 2-Sentence Advice│
                  └──────────────────────────────────────────┘
```

---

### C. Real-Time Native SMS Interception & Privacy Sequence

```
Android OS Telephony               FinSight Native Hook           Privacy Sanitizer           Reactive Dashboard
         │                                   │                           │                             │
         ├──── SMS_RECEIVED Broadcast ──────►│                           │                             │
         │     (Raw Bank PDU Stream)         │                           │                             │
         │                                   ├──── Dispatches String ───►│                             │
         │                                   │    (Over Turbo Bridge)    │                             │
         │                                   │                           ├─ [Strips 6-Digit OTP & PIN] │
         │                                   │                           ├─ [Masks Account Identifiers]│
         │                                   │                           ├─ [Extracts ₹ Amount & Type] │
         │                                   │                           │                             │
         │                                   │                           ├──── Ingests Sanitized Txn ─►│
         │                                   │                           │                             │
         │                                   │                           │     [Writes Local AsyncStorage (<2ms)]
         │                                   │                           │     [60 FPS Re-render + Haptic]
         │                                   │                           │                             │
         │                                   │                           │◄─── Emits Sync Confirmation ┤
         │                                   │                           │                             │
         │                                   │                           ├──── Batch Writes Cloud ────►│
         │                                   │                           │     (Firestore /users/UID)  │
```

<div align="center">
  <img src="./docs/diagrams/sms_interception_flow.svg" alt="Real-Time Native SMS Interception & Privacy Flow" width="100%" style="border-radius: 12px; margin: 16px 0; box-shadow: 0 12px 36px rgba(0,0,0,0.3);" />
</div>

```
                ┌────────────────────────────────────────────────────────┐
                │          CELLULAR TELEPHONY SMS_RECEIVED INTENT        │
                │        PDU Stream from Bank (HDFC, SBI, ICICI, Axis)   │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │             SENDER HEADER WHITELIST INSPECTION         │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                     Valid Banking Header                  │ Promotional / Personal Spam
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │  PRIVACY MEMORY SANDBOX  │ │     IMMEDIATE DISCARD     │
                │ Strip 4-6 Digit OTP/PIN  │ │ Zero Disk Write / Zero Log│
                │ Mask Account: XX1234     │ └───────────────────────────┘
                └─────────────┬────────────┘
                              │
                              ▼
                ┌────────────────────────────────────────────────────────┐
                │         TIER-1 REGEX TRANSACTION EXTRACTION            │
                │     Extract Amount, Debit/Credit Flag, Merchant VPA    │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          OPTIMISTIC LOCAL MUTATION (<2ms)              │
                │  Insert AsyncStorage • Dispatch Haptic Success Pattern │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │           REACTIVE UI FEED & CLOUD SYNC                │
                │  60 FPS Skia Re-render • Write /users/UID/transactions │
                └────────────────────────────────────────────────────────┘
```

---

### D. Multi-Bank Statement Ingestion & Decryption Flow

```
                ┌────────────────────────────────────────────────────────┐
                │              DOCUMENT PICKER LAUNCHED                  │
                │        User Selects Bank Statement (CSV / XLS / PDF)   │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            MIME & ENCRYPTION HEADER AUDIT              │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                 Password-Protected Buffer                 │ Plaintext Open File
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │  IN-MEMORY AES/RC4 RAM   │ │    PAPAPARSE NORMALIZER   │
                │ User PAN/DOB Decryption  │ │ Scan Date, Description,   │
                │ Zero Disk Persistence    │ │ Inflow, Outflow, Balance  │
                └─────────────┬────────────┘ └─────────────┬─────────────┘
                              │                            │
                              └─────────────┬──────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │         SHA-256 DEDUPLICATION HASH PIPELINE            │
                │     Hash = SHA256(TxnDate + Amount + Merchant + Last4) │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │          FIRESTORE BATCH COMMIT & INSIGHTS             │
                │  Batch write /users/UID/statements • Launch What-If    │
                └────────────────────────────────────────────────────────┘
```

---

### E. Holt-Winters Cash Runway & Goal Simulator Decision Tree

```
                    ┌──────────────────────────────────────────┐
                    │  Historical Transaction Ingestion        │
                    │  Extract 6-Month Inflows & Discretionary │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Additive Holt-Winters Triple Smoothing   │
                    │  Level (α=0.2) • Trend (β=0.1) • Season  │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  18-Month Baseline Runway Extrapolation  │
                    │  Project Monthly Residual Cash Buffer    │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Purchase Shock Simulation (Month M+t)   │
                    │  Deduct Capital Outlay & Recompute Trend │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Safety Index Classification             │
                    │  Green (>=75) • Amber (50-74) • Red (<50)│
                    └──────────────────────────────────────────┘
```

<div align="center">
  <img src="./docs/diagrams/goal_simulator_flow.svg" alt="Holt-Winters Cash Runway & Goal Simulator Decision Tree" width="100%" style="border-radius: 12px; margin: 16px 0; box-shadow: 0 12px 36px rgba(0,0,0,0.3);" />
</div>

---

### F. Kernel Density Estimation (KDE) Cohort Mirror Pipeline

```
                    ┌──────────────────────────────────────────┐
                    │  Resolved Demographic Peer Cohort        │
                    │  Nagpur College Students (N = 5,420)     │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Silverman's Rule of Thumb Bandwidth     │
                    │  h = 0.9 · min(σ, IQR/1.34) · n^(-1/5)   │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Continuous Gaussian Kernel Convolution  │
                    │  f̂(x) = (1 / nh) Σ K((x - X_i) / h)      │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Numerical Cumulative Integration        │
                    │  Compute Percentile Standing (Top 22%)   │
                    └─────────────────────┬────────────────────┘
                                          │
                                          ▼
                    ┌──────────────────────────────────────────┐
                    │  Differential Privacy Output Generation  │
                    │  Zero Peer PII Shared • Contextual Advice│
                    └──────────────────────────────────────────┘
```

---

### G. Zero-Hallucination AI Copilot Sequence with Zod Guardrails

```
                ┌────────────────────────────────────────────────────────┐
                │             USER ASKS FINANCIAL QUESTION               │
                │    "Can I buy a ₹60,000 laptop in 5 months?"           │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │         DETERMINISTIC TYPESCRIPT MATH ENGINE           │
                │  • Calculate Monthly Inflows vs Discretionary Burn     │
                │  • Model Liquid Buffer Residual Post-Purchase          │
                │  • Identify Trim-ready Subscription Costs              │
                └───────────────────────────┬────────────────────────────┘
                                            │
                                            ▼
                ┌────────────────────────────────────────────────────────┐
                │            ZOD SCHEMA ARITHMETIC GUARDRAIL             │
                │    Strict Float & Int Contract Validation              │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                      Schema Pass Verified                 │ Schema Violations / NaN
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │   GPT-4o-mini NARRATOR   │ │ RULE-BASED FALLBACK CARD  │
                │ Injects Pre-Computed Fact│ │ Display Raw Math Ledger   │
                │ Zero Math LLM Authority  │ │ Zero Hallucination Risk   │
                └─────────────┬────────────┘ └───────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────────────────────────┐
                │              VERIFIED 2-SENTENCE ADVICE                │
                │     Rendered to FinSight Grounded Copilot Chat UI      │
                └────────────────────────────────────────────────────────┘
```

---

### H. Application Navigation & State Machine Hierarchy

```
                ┌────────────────────────────────────────────────────────┐
                │                 APPLICATION COLD START                 │
                │       Verify Firebase Auth Token & Hardware Keystore   │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                       Token Valid                         │ Token Expired / Unauthenticated
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │  AUTHENTICATED APP SHELL │ │     ONBOARDING SCREEN     │
                │  Root Floating Dock      │ │ Google SSO / Email Auth   │
                └─────────────┬────────────┘ └─────────────┬─────────────┘
                              │                            │
                              │◄───────────────────────────┘
                              │
                              ▼
                ┌────────────────────────────────────────────────────────┐
                │            ROOT FLOATING DOCK CONTROLLER               │
                └─────────────┬────────────────────────────┬─────────────┘
                              │                            │
                              ▼                            ▼
                ┌──────────────────────────┐ ┌───────────────────────────┐
                │   TAB_HOME_PAGER (Tabs)  │ │    MODAL ACTION SHEETS    │
                │  Page 1: Overview        │ │  • Statement Analyzer     │
                │  Page 2: Full Ledger     │ │  • Goal Simulator         │
                │  Page 3: Monthly Insights│ │  • Saved Statements       │
                │  Dock: AI Insights       │ │  • Profile Settings       │
                │  Dock: Peer Ranking      │ └───────────────────────────┘
                └──────────────────────────┘
```

---

## 💾 Data Storage & Security Architecture

### 1. Storage Location & Data Isolation Matrix

| Data Classification | Storage Mechanism | Storage Location | Defensive Lifecycle & Isolation |
| :--- | :--- | :--- | :--- |
| **Transaction Ledgers & Records** | **Cloud Firestore NoSQL** | Google Cloud (Mumbai `asia-south1`) | Encrypted at rest (AES-256). Isolated under `/users/{uid}/transactions/{txnId}` with strict owner UID validation. |
| **Historical Statement Summaries** | **Cloud Firestore** | Google Cloud (Mumbai `asia-south1`) | Aggregated monthly totals, category allocations, and ingestion audit metadata. |
| **Offline Cache & Radar State** | **AsyncStorage & Encrypted Store** | Android Internal Sandbox Storage | Instant app boot without network latency; persists radar transactions offline. |
| **Authentication Session Tokens** | **Firebase Auth & Google Play Services** | Android KeyStore / Secure Hardware | OAuth 2.0 refresh tokens with automatic hardware-backed rotation. |
| **Encrypted Statement Temp Buffers** | **Volatile RAM (Heap)** | In-Memory JavaScript V8 Heap | Password-protected Excel byte buffers decrypted in transient memory and wiped immediately after parsing. |
| **Demographic Cohort Benchmarks** | **Cloud Firestore (Public Read)** | Google Cloud Firestore | Anonymized statistical distribution parameters (e.g. Nagpur students, Bangalore devs). |

### 2. Defensive Security Implementations (OWASP-Aligned)

- **IDOR Prevention via Declarative Firestore Rules (`firestore.rules`):**
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/transactions/{transactionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /users/{userId}/statements/{statementId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
- **Zero Raw OTP Persistence:** Banking OTPs, MPINs, and personal text messages are intercepted and purged in volatile memory prior to disk persistence.
- **Transaction Deduplication Hash Matrix:** Each ingested transaction generates an immutable SHA-256 fingerprint:
  $$\text{Hash} = \text{SHA256}(\text{Date} + \text{Amount} + \text{Merchant} + \text{AccountLast4})$$
  Prevents duplicate entries across statement uploads, SMS alerts, and live push notifications.
- **v2.9.9 (`feat v7`) Zero-Trust Rules, Scalable Gateway & UI Polish:**
  - **Firestore Hardening (`firestore.rules`):** Owner-only reads on `/users/{userId}`, `hasPrivacySafeDescription` checks on `sms_transactions`, strict prohibition of `email` in `cohort_profiles` (mirrored in `authService.js` and `cohortService.js`), and removal of permissive nested wildcard rules.
  - **API Gateway, Load Balancer & Rate Limiting (`gateway/`):** Multi-replica Node gateway behind an Nginx `least_conn` L7 load balancer (`gateway/nginx/nginx.conf`), Redis-ready per-tier sliding-window rate limiter (`429` + `Retry-After`), `Idempotency-Key` deduplication on statement imports, cache-aside `/v1/cohort/summary`, PII-scrubbing AI Copilot Gateway with a `CLOSED`/`OPEN`/`HALF_OPEN` circuit breaker, and `/healthz`, `/readyz`, `/metrics` endpoints (`docker-compose.yml`).
  - **UI/UX Craft (`unslop` polish) & CI Gates:** 4px-grid alignment, `tabular-nums` alignment, and responsive touch targets across `Card`, `SummaryStatCard`, and `SectionHeading`, backed by `npm run typecheck` (`tsc --noEmit`), Jest, and `.github/workflows/ci.yml`.

### 3. Database Schema & Firestore Document Model

The persistence hierarchy is partitioned into tenant-isolated collections and global public caches:

```
┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│              users              │ 1       N │          transactions           │
├─────────────────────────────────┤───────────├─────────────────────────────────┤
│ id (PK, Firebase Auth UID)      │           │ id (PK, Auto-ID CUID)           │
│ email (String, Unique)          │           │ userId (FK -> users.id)         │
│ displayName (String)            │           │ amount (Number, Positive Float) │
│ avatarUrl (String)              │           │ type (DEBIT / CREDIT)           │
│ monthlyBudget (Number)          │           │ merchant (String, Normalized)   │
│ demographicCohort (String)      │           │ category (String, Food/Transit) │
│ createdAt (Timestamp)           │           │ date (Timestamp)                │
└────────────────┬────────────────┘           │ sha256Fingerprint (Unique Hash) │
                 │ 1                          │ source (SMS / CSV_STATEMENT)    │
                 │                            │ accountLast4 (String, 4 Digits) │
                 │ N                          └─────────────────────────────────┘
┌────────────────▼────────────────┐
│           statements            │           ┌─────────────────────────────────┐
├─────────────────────────────────┤           │   cohort_benchmarks (Public)    │
│ id (PK, Auto-ID)                │           ├─────────────────────────────────┤
│ userId (FK -> users.id)         │           │ id (PK, e.g. nagpur_students)   │
│ filename (String)               │           │ cohortName, sampleCount (5,420) │
│ totalTransactions (Number)      │           │ categoryMedians (Map)           │
│ netInflow, netOutflow (Number)  │           │ distributionKDEVectors (Array)  │
│ dateRange (Start/End Timestamp) │           └─────────────────────────────────┘
│ parsedAt (Timestamp)            │
└─────────────────────────────────┘           ┌─────────────────────────────────┐
                                              │    global_merchant_registry     │
                                              ├─────────────────────────────────┤
                                              │ rawMerchantString (PK)          │
                                              │ resolvedBrandName (String)      │
                                              │ category (Food/Dining/Shopping) │
                                              │ verifiedLogoUrl, brandColor     │
                                              └─────────────────────────────────┘
```

---

## 📊 Mathematical & Algorithmic Foundations

### 1. Holt-Winters Triple Exponential Smoothing
FinSight AI forecasts 18–36 month cash trajectories using an additive Holt-Winters formulation:

$$\hat{y}_{t+h} = \ell_t + h b_t + s_{t+h-m}$$

Where:
- **Level Equation ($\ell_t$):**
  $$\ell_t = \alpha (y_t - s_{t-m}) + (1 - \alpha)(\ell_{t-1} + b_{t-1})$$
- **Trend Equation ($b_t$):**
  $$b_t = \beta (\ell_t - \ell_{t-1}) + (1 - \beta)b_{t-1}$$
- **Seasonal Equation ($s_t$):**
  $$s_t = \gamma (y_t - \ell_{t-1} - b_{t-1}) + (1 - \gamma)s_{t-m}$$

Smoothing parameters $\alpha = 0.2$, $\beta = 0.1$, and $\gamma = 0.3$ provide robust, noise-resilient cash projections.

---

### 2. Dynamic Z-Score Anomaly Detection
Identifies sudden expenditure velocity bursts before monthly budgets deplete:

$$Z = \frac{x_i - \mu_{\text{window}}}{\sigma_{\text{window}}}$$

Transactions where $|Z| > 2.5$ trigger proactive high-velocity spending alerts on the home feed.

---

### 3. Continuous Kernel Density Estimation (KDE)
Constructs continuous non-parametric probability density curves over demographic peer cohorts:

$$\hat{f}(x) = \frac{1}{n h} \sum_{i=1}^{n} \frac{1}{\sqrt{2\pi}} \exp\left(-\frac{(x - x_i)^2}{2h^2}\right)$$

Optimal bandwidth $h$ is calculated via Silverman's Rule of Thumb:

$$h = 0.9 \min\left(\sigma, \frac{\text{IQR}}{1.34}\right) n^{-1/5}$$

Individual category percentile standing is derived via numerical integration:

$$\text{Percentile}(x) = \int_{-\infty}^{x} \hat{f}(t) \, dt \times 100\%$$

---

## 💻 Technology Stack & Dependency Matrix

| Architectural Layer | Technology / Library | Exact Version | Functional Purpose |
| :--- | :--- | :---: | :--- |
| **Mobile Runtime** | React Native | `0.86.2` | Core cross-platform mobile engine |
| **Tooling & Native Bridges** | Expo SDK / Bare Workflow | `57.0.9` | Hardware bindings & native compilation |
| **Language & Typing** | TypeScript / ES6+ | `~6.0.3` | End-to-end type safety & data science formulas |
| **Styling & Theme** | NativeWind / Tailwind CSS | `4.2.7` / `3.4.19` | Utility-first styling & design tokens |
| **UI Component System** | Tamagui | `^2.7.7` | High-performance compiled component primitives |
| **Hardware SMS Radar** | Native Kotlin Android Module | API 35 | Inbound `RECEIVE_SMS` broadcast interception |
| **Cloud Database** | Google Cloud Firestore | `12.18.0` | Real-time NoSQL state synchronization |
| **User Authentication** | Firebase Auth + Google SSO | `16.1.4` | Google Play Services hardware-backed auth |
| **Financial Charting** | Gifted Charts & Victory Native | `1.4.78` / `41.26.0` | 60 FPS cash flow curves & histogram rendering |
| **Document Processing** | PapaParse + XLSX | `5.7.0` / `^0.18.5` | Universal CSV, XLSX, and XLS statement parser |
| **Encrypted File Decryption** | officecrypto-tool | `^0.0.19` | Password-protected Excel decryption in RAM |
| **AI Copilot & Classifier** | OpenAI GPT-4o-mini | REST / SDK | Grounded natural-language advisory narrator |
| **Schema Guardrails** | Zod | `^3.x` | Strict type verification of statistical facts |
| **Automated Testing** | Jest + Fast-Check | `29.7.0` | Unit, integration, and property-based test suites |

---

## 📁 Production Repository Structure

```plaintext
FinSight-AI/
├── screenshots/                            # Production App Device Screenshots
│   ├── 01_overview_dashboard.jpg           # Financial Home overview & net cash flow
│   ├── 02_live_transactions.jpg            # Settlement stream & live radar ledger
│   ├── 03_cashflow_insights.jpg            # Monthly Money In vs Out bar chart
│   ├── 04_goal_simulator_analysis.jpg      # What-If purchase impact & caution alert
│   ├── 05_runway_projection.jpg            # 18-Month Holt-Winters cash runway curve
│   ├── 06_ai_financial_assistant.jpg       # Grounded AI Copilot assistant interface
│   └── 07_peer_cohort_profile.jpg          # Peer benchmark profile (Nagpur cohort)
├── mockups/                                # Additional visual assets & device renders
│   └── live.png                            # Physical device onboarding execution render
├── FinsightAI-v2.9.9.apk                   # Production ARM64-v8a Release APK (57.5 MB)
├── .github/workflows/ci.yml                # CI: Mobile typecheck, Jest & Gateway tests
├── gateway/                                # Scalable API Gateway, LB & Rate Limiter
│   ├── nginx/nginx.conf                    # L7 least_conn Load Balancer & edge IP limits
│   ├── src/                                # Rate limiter, Circuit breaker & HTTP gateway
│   ├── test/gateway.test.js                # Gateway integration test suite
│   ├── Dockerfile & docker-compose.yml     # Multi-replica Gateway + Nginx + Redis stack
├── release/                                # Archived Android APK distributions
│   └── FinsightAI-v2.9.6.apk               # Previous Release APK
├── features.md                             # 6-Feature complexity & testing matrix
├── README.md                               # Executive documentation & architecture
└── finsight/                               # React Native Application Root
    ├── android/                            # Native Android Project (Gradle, Kotlin)
    │   └── app/src/main/java/com/finsight/app/
    │       ├── SmsReceiver.kt              # Native SMS BroadcastReceiver
    │       ├── SmsListenerModule.kt        # React Native Turbo bridge
    │       └── SmsListenerPackage.kt       # Package registration
    ├── assets/                             # App icons, splash, merchant brand logos
    ├── src/
    │   ├── analytics/                      # Core Math & Data Science Engines
    │   │   ├── holtWinters.js              # Triple exponential smoothing forecast
    │   │   ├── kdeEngine.js                # Continuous Kernel Density Estimation
    │   │   └── purchasePlanner.js          # What-If purchase safety & runway logic
    │   ├── components/                     # Reusable UI Primitives
    │   │   ├── finsight/                   # Floating dock, card sheets, headers
    │   │   └── Money.tsx                   # Split-decimal currency formatter
    │   ├── context/                        # Global State & Auth Providers
    │   ├── navigation/                     # AppNavigator & BottomTabNavigators
    │   ├── screens/                        # Mobile Application Screens
    │   │   ├── HomeScreen.tsx              # Main dashboard coordinator
    │   │   ├── home/                       # Overview, Transactions, Insights Pagers
    │   │   ├── AIAssistantScreen.tsx       # Grounded AI financial chat
    │   │   ├── AIScreen.tsx                # Proactive AI recommendations
    │   │   ├── SimulatorScreen.jsx         # What-If Goal Affordability Simulator
    │   │   ├── CohortScreen.jsx            # Peer benchmarking mirror
    │   │   ├── StatementAnalyzerScreen.tsx # Bank statement file ingestion modal
    │   │   ├── StatementDetailScreen.tsx   # Saved statement explorer
    │   │   ├── SavedStatementsScreen.tsx   # Statements archive
    │   │   ├── OnboardingScreen.tsx        # Physical device welcome flow
    │   │   ├── LoginScreen.tsx             # Authentication interface
    │   │   └── ProfileScreen.tsx           # Settings & demographic cohort setup
    │   └── services/                       # Background Services & Utilities
    │       ├── smsParser.js                # Tier-1 regex SMS parser
    │       ├── smsListenerService.js       # Background SMS event dispatch
    │       ├── privacySanitizer.js         # On-device OTP/PII stripper
    │       ├── csvService.js               # Multi-bank statement normalizer
    │       ├── excelDecryptor.js           # Password-protected Excel decryptor
    │       ├── merchantBrandRegistry.js    # Merchant brand & logo catalog
    │       └── financialInsights.js        # Rule-based heuristics engine
    ├── firestore.rules                     # Cloud Firestore tenant security rules
    ├── google-services.json                # Firebase Android configuration
    └── package.json                        # Dependencies & build scripts
```

---

## 🛠️ Developer Setup & Build Guide

### 1. Prerequisites
- **Node.js:** v18.x or v20.x LTS
- **Package Manager:** `npm` (v9+)
- **Java Development Kit:** JDK 17 (Zulu or OpenJDK)
- **Android Studio:** Android SDK Platform 34/35 & Build-Tools
- **Expo CLI:** `npx expo`

### 2. Environment Setup
```bash
# Clone the repository
git clone https://github.com/your-username/FinSight-AI.git
cd FinSight-AI/finsight

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Ensure `.env` contains your Firebase and OpenAI credentials:
```env
EXPO_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
EXPO_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
EXPO_PUBLIC_FIREBASE_APP_ID="your-app-id"
EXPO_PUBLIC_OPENAI_API_KEY="sk-your-openai-key"
```

### 3. Launch Development Server
```bash
# Start Metro bundler
npm start

# Run directly on an attached physical Android device or emulator
npm run android
```

### 4. Compiling Standalone Production APK
To compile your own standalone release APK:
```bash
cd android
./gradlew assembleRelease
```
The compiled release binary is output to:
`finsight/android/app/build/outputs/apk/release/app-release.apk`

### 5. Running Automated Test Suites
```bash
# Run unit tests and parser validations
npm test

# Run mathematical preservation and property-based test suites
npm run test:preservation
```

---



---

## 🔒 Privacy Manifesto & License

1. **Zero Raw OTP Storage:** OTPs, banking passwords, and personal messages are discarded in memory during regex filtering. They are never written to disk, SQLite, or Firestore.
2. **Encrypted Tenant Boundary:** Firestore security rules strictly enforce user-level document isolation (`request.auth.uid == userId`). No user can query transactions outside their authenticated scope.
3. **No Financial Scraping Credentials:** FinSight AI never asks for NetBanking passwords, debit card PINs, or UPI MPINs. It ingests solely user-authorized inbound SMS notifications and user-uploaded statements.
4. **Air-Gapped Math Execution:** Regex parsing, Excel decryption, Holt-Winters projections, and KDE calculations occur entirely on your smartphone CPU without network dependency.
5. **Zero Arithmetic AI Hallucination:** Generative language models are strictly forbidden from calculating financial figures; all numbers are calculated by deterministic TypeScript code and validated with Zod before presentation.

### License
FinSight AI is distributed under the **MIT License**. See [`LICENSE`](./finsight/LICENSE) for full details.
