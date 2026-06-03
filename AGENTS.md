# ShipEasy Mobile — Agent Context

## Project
ShipEasy Canada mobile app — React Native (Expo SDK 56) for iOS/Android.

## Quick Start
```bash
cd /Users/bolo/websites/shipeasy-mobile
npx expo start        # Development
npx expo start --ios  # iOS simulator
npx expo start --web  # Web preview
```

## Key Commands
- `npm run start` — Start Expo dev server
- `npm run ios` — Open in iOS simulator
- `npm run android` — Open in Android emulator
- `npm run web` — Open in browser

## Architecture
- **Expo Router** — file-based routing in `app/` directory (tabs + stack)
- **TanStack Query** — all API data fetching/caching in `lib/queries.ts`
- **Zustand** — client state (auth, wallet balance) in `store/`
- **Axios** — HTTP client in `lib/api.ts` with auth interceptor
- **Types** — backend models in `types/index.ts`

## API Base
`https://shipeasyplus.netlify.app/api`

## Project Structure
```
app/          # Expo Router screens (file-based routing)
components/   # UI primitives + screen-specific components
lib/          # API client, queries, utilities
store/        # Zustand stores
types/        # TypeScript types
_mockup/      # Original Claude mockup (design reference only)
```

## Current State (Checkpoint)

### Completed
- [x] Project scaffolded (Expo SDK 56, TypeScript)
- [x] Dependencies installed (expo-router, tanstack-query, zustand, axios, zod, secure-store, web-browser, reanimated)
- [x] PROJECT_PLAN.md created
- [x] AGENTS.md created
- [x] **Expo Router setup** — `app/_layout.tsx` (QueryClientProvider + auth initializer + Stack nav) and `app/(tabs)/_layout.tsx` (tab bar with FAB)
- [x] **Types** — `types/index.ts` matching all backend models (Shipment, User, Transaction, Address, SKU, ShippingRate, TrackingEvent, Pagination, AIParsedAddress)
- [x] **API client** — `lib/api.ts` with Axios instance, auth interceptor reading from SecureStore, error handling
- [x] **Auth store** — `store/auth.ts` (Zustand): login, register, logout, isAuthenticated, guest mode, token management via SecureStore
- [x] **Wallet store** — `store/wallet.ts` (Zustand): balance management
- [x] **Queries** — `lib/queries.ts`: TanStack Query hooks for all endpoints (shipments, wallet, rates, addresses, SKUs, AI, checkout, update/delete mutations)
- [x] **UI primitives** — `components/ui/`: Button, Card, Badge components
- [x] **Home screen** — Balance card, quick actions (4), Magic Batch promo, real API data via `useWalletData`, pull-to-refresh
- [x] **Shipments screen** — Search bar, All/Active/Delivered segment tabs, list from real API via `useShipments`, pull-to-refresh
- [x] **Wallet screen** — Balance card, add funds/ship buttons, stats cards, transaction history from API via `useWalletData`, pull-to-refresh
- [x] **Wallet top-up** — `app/wallet/topup.tsx` with amount presets, custom input, Stripe Checkout via `expo-web-browser`
- [x] **Profile screen** — Authenticated (user card, settings, logout) and guest (sign in/register CTAs) modes
- [x] **Auth screens** — `app/auth/login.tsx` and `app/auth/register.tsx` with form validation
- [x] **Wizard** — `app/wizard/_layout.tsx` with 5 real steps (Address, Package, Customs, Rates, Review) + Success screen
  - Step 1: Saved addresses picker + recipient form
  - Step 2: SKU picker (bottom sheet), package type, weight/dimensions
  - Step 3: Customs items, AI HS code classification via `/api/ai/classify-hs`
  - Step 4: Live rates from `/api/rates` with Skeletons while loading
  - Step 5: Review summary + wallet balance check
  - Purchase: `POST /api/shipments` on confirm
- [x] **Magic Batch** — `app/batch.tsx`: textarea input, AI parse, bulk rates (parallel), bulk purchase (sequential)
- [x] **SKU Manager** — `app/skus/index.tsx`: list, search, create/edit modal, soft-delete with confirmation, pull-to-refresh
- [x] **Address Book** — `app/addresses/index.tsx`: list, search, create/edit modal, delete, province picker, default/residential toggles, pull-to-refresh
- [x] **Shipment detail** — `app/shipments/[id].tsx` with hero card, details, real tracking timeline from `/api/shipments/[id]/track`
- [x] **Pull-to-refresh** — On all list screens (Home, Shipments, Wallet, SKUs, Addresses)
- [x] **Push notifications** — `lib/notifications.ts`: Expo push token registration, permission request, foreground handler, notification tap → navigation, Android notification channels
- [x] **Biometric wallet lock** — `store/biometric.ts`: Zustand store, `app/(tabs)/wallet.tsx` lock overlay with `expo-local-authentication`, `app/(tabs)/profile.tsx` toggle with hardware/enrollment checks, supports both iOS (Face ID/Touch ID) and Android (fingerprint/face)
- [x] **Backend push** — `src/models/User.ts` (pushToken field), `POST /api/auth/push-token`, `DELETE /api/auth/push-token`, `src/lib/push.ts` (sendPushNotification + notifyUser via Expo Push API), integrated into Stripe webhook (wallet top-up) and shipment creation (label purchase + low balance)

### Auth Fix (Website + Mobile)
- [x] **`POST /api/auth/mobile-login`** — New website endpoint: validates email/password, returns JWT + user
- [x] **`GET /api/auth/me`** — New website endpoint: verifies Bearer token, returns current user
- [x] **`requireAuth()` / `requireAdmin()` updated** — Now checks Bearer token (mobile) first, then NextAuth session (web) as fallback. All existing API routes work with both auth methods.
2. **Wizard step content** — Fill in each step with real forms and API calls (address selection, SKU picker, customs, rates, payment)
3. **Magic Batch** — Textarea input + AI parse + bulk rates + bulk purchase flow
4. **SKU Manager** — List SKUs from API, create/edit/delete, search
5. **Address Book** — List, create, edit, delete saved addresses
6. **Stripe Checkout** — WebView-based top-up and guest checkout
7. **Shipment detail tracking** — Real timeline from `/api/shipments/[id]/track`
8. **Pull-to-refresh** — On all list screens
9. **Push notifications** — Expo Notifications for shipment status
10. **Biometric wallet lock** — `expo-local-authentication`

## Design Reference
The mockup at `_mockup/Ship Easy/` has all screen designs. Key patterns:
- Tab bar: Home, Shipments, FAB (+), Wallet, Profile
- Colors: Accent `#635BFF`, surface, hairline borders
- Components: Cell, Card, Badge, BalanceCard, PackageIcon
- Animations: fade-up, stagger, screen transitions

## Backend API Patterns
- Auth: NextAuth credentials provider (JWT in cookie/session)
- All authenticated routes return 401 if no valid session
- Pagination: `?page=1&limit=20` on list endpoints
- Error format: `{ error: string }` with appropriate status codes
- Wallet operations: Stripe Checkout for top-up, wallet balance deducted for shipments

## Notes
- Guest mode first — let users browse rates and create shipments via Stripe Checkout before requiring login
- WebView-based Stripe Checkout avoids need for mobile Stripe SDK complexity
- Use `expo-web-browser` for auth redirects (not WebView for login)
