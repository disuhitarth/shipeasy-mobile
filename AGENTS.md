# ShipEasy Mobile — Agent Context

## Project
ShipEasy Canada mobile app — React Native (Expo SDK 56) for iOS/Android.
- GitHub: `https://github.com/disuhitarth/shipeasy-mobile`
- Website GitHub: `https://github.com/disuhitarth/shipeasy-canada`
- API: `https://shipeasyplus.netlify.app/api`

## Quick Start
```bash
cd /Users/bolo/websites/ShipEasy-Mobile
npx expo start        # Development (QR with Expo Go)
npx expo start --ios  # iOS simulator
npx expo start --web  # Web preview
```

## Key Commands
- `npm run start` — Start Expo dev server
- `npm run ios` — Open in iOS simulator
- `npm run android` — Open in Android emulator
- `npm run web` — Open in browser
- `eas build -p android --profile preview` — Build APK
- `eas build -p android --profile production` — Build AAB (Play Store)

## Architecture
- **Expo Router** — file-based routing in `app/` directory (tabs + stack)
- **TanStack Query** — all API data fetching/caching in `lib/queries.ts`
- **Zustand** — client state (auth, wallet balance, biometric) in `store/`
- **Axios** — HTTP client in `lib/api.ts` with auth interceptor
- **Types** — backend models in `types/index.ts`

## Project Structure
```
app/              # Expo Router screens (file-based routing)
  (tabs)/         # Tab screens (Home, Shipments, Wallet, Profile)
  auth/           # Login / Register
  wizard/         # 5-step shipment creation wizard
  shipments/[id]  # Detail + tracking timeline + label preview + void
  batch.tsx       # Magic Batch bulk shipping
  ship-now.tsx    # Guest checkout (Stripe)
  addresses/      # Address Book CRUD
  skus/           # SKU Manager CRUD
  wallet/         # Wallet top-up
components/       # UI primitives + wizard step components
lib/              # API client, queries, notifications, utilities
store/            # Zustand stores (auth, wallet, biometric)
types/            # TypeScript types
assets/           # Icons, splash (placeholders)
_mockup/          # Original Claude mockup (design reference only)
```

## Deployment
- **Website**: Deployed to `shipeasyplus.netlify.app`. To redeploy:
  - Push to `main` on `disuhitarth/shipeasy-canada`
  - Or run from website dir: `netlify deploy --build --prod`
  - Or trigger build hook: `curl -X POST https://api.netlify.com/build_hooks/6a20a871893855e227f1a7e1`
- **Mobile APK**: `eas build -p android --profile preview`
- **Play Store**: `eas build -p android --profile production` then `eas submit -p android`

## Current State (Checkpoint)

### Completed
- [x] Project scaffolded (Expo SDK 56, TypeScript)
- [x] All deps installed (expo-router, tanstack-query, zustand, axios, secure-store, web-browser, reanimated, notifications, local-auth, file-system, sharing)
- [x] Expo Router: root layout (QueryClient, auth boot, biometric init, notifications init, Stack nav) + 4-tab bar with FAB
- [x] Types: all backend models (Shipment, User, Transaction, Address, SKU, ShippingRate, TrackingEvent, Pagination, AIParsedAddress)
- [x] API client: Axios → Netlify with SecureStore Bearer interceptor + ApiError
- [x] 18 TanStack Query hooks: CRUD for all endpoints
- [x] Auth store: login, register, logout, guest, loadToken + SecureStore
- [x] Wallet store: balance management (set, deduct, add)
- [x] Biometric store: Face ID / fingerprint lock for wallet
- [x] Tab screens: Home (balance + quick actions + pull-to-refresh), Shipments (search + segments + list), Wallet (balance + stats + transactions + auto-reload + biometric lock), Profile (settings + biometric toggle + lock)
- [x] Auth screens: Login + Register with form validation
- [x] Wizard: 5 real steps (Address → Package → Customs → Rates → Review) + Success screen with label download
- [x] Magic Batch: textarea → AI parse → review → parallel rates → sequential purchase
- [x] SKU Manager: list, search, create/edit modal, soft-delete, pull-to-refresh
- [x] Address Book: list, search, create/edit modal, province picker, toggles, delete, pull-to-refresh
- [x] Wallet Top-Up: amount presets ($25-$500), custom input, Stripe Checkout
- [x] Shipment Detail: hero card, tracking timeline, label preview (download + share), void button
- [x] Guest Checkout: simplified Ship Now form, package presets, Stripe payment
- [x] Push Notifications: permissions, token registration, foreground handler, navigation on tap, Android channels
- [x] Backend Push: User model (pushToken), push-token endpoints, sendPushNotification + notifyUser, Stripe webhook + shipment integration
- [x] Auto-Reload: backend PUT endpoint + GET settings, mobile UI (toggle, threshold, amount)
- [x] Website Auth Fix: POST /api/auth/mobile-login, GET /api/auth/me, dual auth (Bearer + NextAuth)
- [x] Deploy Prep: app.json (iOS FaceID config, Android biometric/notification perms), eas.json, placeholder assets
- [x] GitHub: both repos pushed to `disuhitarth/{shipeasy-mobile,shipeasy-canada}` (private)
- [x] Netlify: website deployed to `shipeasyplus.netlify.app`, env vars set, build hook configured

### Not Started
- [ ] Auto-deploy from GitHub (set up via Netlify UI: Site Settings → Build & Deploy → Git → `disuhitarth/shipeasy-canada`)
- [ ] Replace placeholder `assets/` with real branding (icon.png 1024×1024, splash.png 1242×2436, adaptive-icon.png 1024×1024, favicon.png 48×48)
- [ ] Create EAS project at `expo.dev` and set `projectId` in `app.json extra.eas.projectId`
- [ ] iOS: need Apple Developer account for provisioning profiles + App Store Connect
- [ ] Stripe webhook endpoint needs to be updated in Stripe Dashboard to point to `https://shipeasyplus.netlify.app/api/webhooks/stripe`

## Critical Context
- API base: `https://shipeasyplus.netlify.app/api` (live)
- Website env vars are set on Netlify (MongoDB, Stripe, Stallion, Gemini, etc.)
- SecureStore not available on web — falls back to localStorage for dev preview
- `expo-file-system` SDK 56 uses new OOP API; legacy API at `expo-file-system/legacy`
- `expo-notifications` requires EAS project ID for push tokens to work

## Design Reference
The mockup at `_mockup/Ship Easy/` has all screen designs. Key patterns:
- Tab bar: Home, Shipments, FAB (+), Wallet, Profile
- Colors: Accent `#635BFF`, surface, hairline borders
- Components: Cell, Card, Badge, BalanceCard, PackageIcon
- Animations: fade-up, stagger, screen transitions
