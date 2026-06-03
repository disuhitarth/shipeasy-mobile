# ShipEasy Mobile — Project Plan

## Overview
React Native (Expo) mobile app for ShipEasy Canada — a shipping platform for Canadian businesses. Consumes the existing Next.js API at `https://shipeasyplus.netlify.app/api`. Supports iOS and Android.

## Architecture

```
shipeasy-mobile/
├── app/                    # Expo Router (file-based routing)
│   ├── (tabs)/             # Bottom tab navigator
│   │   ├── _layout.tsx     # Tab bar config
│   │   ├── index.tsx       # Home
│   │   ├── shipments.tsx   # Shipments list
│   │   ├── wallet.tsx      # Wallet
│   │   └── profile.tsx     # Profile
│   ├── wizard/             # Multi-step shipping wizard
│   │   ├── _layout.tsx
│   │   ├── step-1-address.tsx
│   │   ├── step-2-package.tsx
│   │   ├── step-3-customs.tsx
│   │   ├── step-4-rates.tsx
│   │   └── step-5-review.tsx
│   ├── batch.tsx           # Magic Batch bulk shipping
│   ├── skus/               # SKU Manager
│   ├── shipments/[id].tsx  # Detail + tracking
│   ├── auth/               # Login + Register
│   └── _layout.tsx         # Root layout (providers)
├── components/
│   ├── ui/                 # Primitive components (Button, Card, Badge, Icon, etc.)
│   ├── wizard/             # Wizard-specific components
│   └── batch/              # Batch-specific components
├── lib/
│   ├── api.ts              # Axios instance with auth interceptor
│   ├── queries.ts          # TanStack Query hooks per endpoint
│   └── stripe.ts           # Stripe SDK helpers
├── store/
│   ├── auth.ts             # Zustand auth store
│   └── wallet.ts           # Zustand wallet store
├── types/
│   └── index.ts            # Shared TypeScript types (match backend models)
├── _mockup/                # Original Claude-generated mobile mockup (reference)
├── AGENTS.md               # AI agent memory/context
├── app.json                # Expo config
└── tsconfig.json
```

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native (Expo SDK 56) |
| Navigation | Expo Router (file-based, like Next.js App Router) |
| State (client) | Zustand |
| Server state | TanStack Query v5 |
| HTTP | Axios |
| Auth | NextAuth credentials via SecureStore + Axios interceptor |
| Payments | Stripe (WebView Checkout) |
| Icons | `@expo/vector-icons` / Ionicons |
| Animations | React Native Reanimated |
| Validation | Zod (runtime) + TypeScript (compile-time) |

## Build Phases

### Phase 1: Foundation
- [x] Scaffold Expo project
- [x] Install dependencies
- [ ] Set up Expo Router (`app/_layout.tsx`, `app/(tabs)/_layout.tsx`)
- [ ] Create `types/index.ts` matching backend models
- [ ] Create `lib/api.ts` with Axios + auth interceptor
- [ ] Create `lib/queries.ts` with TanStack Query hooks
- [ ] Create `store/auth.ts` (Zustand)
- [ ] Create core UI primitives (Button, Card, Badge, Icon)

### Phase 2: Core Screens (Tab Bar)
- [ ] Home — balance card, quick actions, recent shipments
- [ ] Shipments — search, filters, list, pull-to-refresh
- [ ] Shipment Detail — tracking timeline, receipt, void
- [ ] Wallet — balance, transaction history, top-up
- [ ] Profile — user info, settings, logout

### Phase 3: Auth & Guest Mode
- [ ] Login screen (email + password)
- [ ] Register screen
- [ ] Guest mode (no auth required for browsing/rates)
- [ ] Secure token storage + auto-login
- [ ] Protected routes (wallet, SKUs, shipments)

### Phase 4: Shipping Wizard
- [ ] Step 1 — Address (saved addresses + new)
- [ ] Step 2 — Package (SKU picker, weight, dimensions)
- [ ] Step 3 — Customs (items, HS codes, AI classification)
- [ ] Step 4 — Rates (live from Stallion via API)
- [ ] Step 5 — Review & Pay (wallet deduct)

### Phase 5: Advanced Features
- [ ] Magic Batch (bulk address parsing + Gemini)
- [ ] SKU Manager (CRUD)
- [ ] Address Book (CRUD)

### Phase 6: Polish & Store Prep
- [ ] Animations & transitions
- [ ] Push notifications (shipment updates)
- [ ] Biometric wallet lock
- [ ] Offline persistence (TanStack Query persist)
- [ ] Error handling & retry
- [ ] EAS Build config
- [ ] App Store / Play Store assets

## API Endpoints (from existing backend)

| Method | Endpoint | Screen |
|---|---|---|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/[...nextauth]` | Login |
| GET | `/api/shipments` | Shipments |
| POST | `/api/shipments` | Wizard |
| GET | `/api/shipments/[code]` | Detail |
| POST | `/api/shipments/[code]/void` | Detail |
| GET | `/api/shipments/[code]/track` | Detail |
| POST | `/api/rates` | Wizard (rates step) |
| GET | `/api/wallet` | Wallet |
| POST | `/api/wallet/topup` | Wallet |
| GET | `/api/addresses` | Wizard / Address Book |
| POST | `/api/addresses` | Wizard / Address Book |
| GET | `/api/skus` | SKU Manager / Wizard |
| POST | `/api/skus` | SKU Manager |
| POST | `/api/ai/parse-batch` | Magic Batch |
| POST | `/api/ai/classify-hs` | Wizard (customs step) |
| POST | `/api/address/verify` | Wizard |
| POST | `/api/rates/quote` | Home (quick quote) |
| POST | `/api/checkout/guest` | Guest checkout |

## Design Reference
The mockup in `_mockup/Ship Easy/` contains a fully functional iPhone mockup built with React + raw CSS. All component designs (Home, Shipments, Wallet, Wizard, Batch, SKUs) are modelled after this mockup. Key design tokens:
- Accent: `#635BFF` (Stripe indigo)
- Radius: 22px (rounded corners)
- iPhone shell: 393×852px
- Font: SF Pro / system-ui
