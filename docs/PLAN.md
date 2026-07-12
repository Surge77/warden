# Warden — Project Plan

> Format follows the workspace "Prompt Context template". This document is the single source of truth for scope; anything not listed under Functional Requirements is OUT OF SCOPE for v1.

## PROJECT

**Warden — Warranty & Receipt Vault.** Snap a receipt → on-device OCR extracts merchant/date/total → attach a warranty length and return window → Warden reminds you before the return window closes, before the warranty expires, and 30 days before expiry to test the product while a claim is still possible. 100% offline. No account. No cloud. Monetized as a freemium one-time unlock on the Google Play Store (global, USD).

## USERS

- Anyone who buys electronics/appliances and loses receipts (global consumer).
- Privacy-conscious users who refuse cloud receipt uploads.
- Primary persona: buys 5–30 durable goods/year, has been burned by a denied return or warranty claim at least once.

## FUNCTIONAL REQUIREMENTS

1. Capture a receipt via camera or gallery import.
2. On-device OCR (ML Kit) → parse merchant, purchase date, total (reused Receiptly parser, 91.7% amount-accuracy baseline).
3. Parser additionally detects warranty hints in receipt text ("1 YEAR WARRANTY", "WARRANTY: 12 MONTHS") and pre-fills warranty length.
4. Review screen: user confirms/edits fields; picks warranty length via chips (6mo / 1yr / 2yr / custom) and return window (7 / 15 / 30 days / custom / none).
5. Item list: all tracked items, searchable by merchant/item name, filterable by category and "expiring soon".
6. Item detail: receipt image, purchase info, live countdown to return deadline and warranty expiry.
7. Reminders (local notifications, offline):
   - Return window: N days before return deadline (default 2).
   - Warranty expiry: 7 days before.
   - Test-before-expiry nudge: 30 days before warranty expiry ("test the device now, claim while you can").
8. Dashboard: items under warranty, expiring this month, **total value protected** (sum of purchase prices of in-warranty items).
9. Claim pack: export/share receipt image + purchase details for a warranty claim.
10. JSON backup export/import (share sheet + document picker) — reused.
11. Biometric app lock (settings toggle, fails open) — reused.
12. Freemium gate: free tier tracks up to 5 items; Pro (one-time purchase) unlocks unlimited items + claim pack + custom reminder timing. v1 ships the gate with a local unlock stub; Play Billing wired before store release.

## NON-FUNCTIONAL REQUIREMENTS

- Fully offline; the app must function with network permission never exercised.
- Capture→parsed review screen in < 2s on a mid-range device.
- All money stored as integer paise/cents — never floats.
- App size: no new heavy native deps beyond the Receiptly graph.

## TECH STACK

Expo SDK 56 · React Native 0.85 · React 19 · TypeScript strict · Expo Router · expo-camera · @react-native-ml-kit/text-recognition · expo-sqlite + Drizzle ORM · Zustand · dayjs · expo-notifications · expo-local-authentication · Jest (+ better-sqlite3 for headless DB tests). Inherited from Receiptly — **do not introduce new technologies** without a dependency audit.

## ARCHITECTURE

- **Pure core, thin shell**: parser (`src/services/receipt-parser.ts`), warranty date math, and category rules are pure TS — no React/native/DB imports; 100% unit-testable.
- **Repository pattern**: repositories take an injected Drizzle DB (`AppDatabase`); expo-sqlite on device, better-sqlite3 in tests.
- **UI**: Expo Router screens in `app/`, shared components in `src/components/`, thermal-receipt design system carried over.
- **State**: Zustand store per domain (`item-store`), no global god-store.

## DOMAIN ENTITIES

- **Item**: id, name, merchant, category, purchaseDate, priceMinor (int), currency, receiptImageUri, returnWindowDays?, warrantyMonths?, notes, createdAt.
- **Derived**: returnDeadline = purchaseDate + returnWindowDays; warrantyExpiry = purchaseDate + warrantyMonths.
- **Reminder**: id, itemId, kind (return | expiry | test-nudge), fireAt, notificationId, status.
- **Settings**: key/value (reused).

## DATABASE SCHEMA

- Migration 0000/0001 inherited (expenses, budgets, merchant_memory, settings).
- **Migration 0002**: `items` table (fields above) + `reminders` table. Expense tables retained but unused by UI (kept to avoid destructive migration; removed in a later cleanup migration once stable).
- Drizzle `.sql` migrations inlined via babel-plugin-inline-import; regenerate with `npm run db:generate`.

## API CONTRACTS

None. No backend. The only external surface is the OS: notifications, share sheet, document picker, biometrics.

## CONSTRAINTS

- File size hard limit 300 lines; no `any`; named exports only.
- No network calls in core flows — the privacy claim must stay verifiable.
- Money: integer minor units only.
- Gradle 9 note: re-patch `foojay-resolver-convention` to 1.0.0 in node_modules after every npm install (RN gradle-plugin pin; facebook/react-native#55781).

## CODING RULES

Per workspace rules: conventional commits; branch per feature (`feature/…`), merge `--no-ff`; tests before implementation (TDD) for pure modules; `tsc --noEmit` + `jest` green before every commit; no commented-out code.

## CURRENT IMPLEMENTATION

Scaffolded from Receiptly v0.2.0 (working release APK): OCR pipeline, parser, SQLite/Drizzle data layer, reminders service, backup, app lock, CSV/PDF export, design system, 128 tests. Warranty domain not yet present — that is this project.

## SECURITY REQUIREMENTS

- No secrets in repo. No analytics/tracking SDKs. No network permission use in core flows.
- Receipt images stored app-private, compressed ≤1600px.
- Biometric lock optional; fails open without enrolled biometrics.
- All user input validated at boundaries (parser output treated as untrusted).

## PERFORMANCE REQUIREMENTS

- OCR+parse < 2s mid-range device; list screens virtualized; no N+1 queries (repositories batch).
- Reminder scheduling is O(items changed), not O(all items) on every app start.

## TESTING STRATEGY

- Pure modules (parser, warranty date math, claim-pack builder): unit tests, 100% coverage target.
- Repositories: headless CRUD tests via better-sqlite3.
- Reminder scheduling: pure planner function unit-tested; OS notification calls covered at E2E level only.
- RNTL rendering tests intentionally omitted (npm ci peer conflict — documented in Receiptly); behavior covered headlessly.
- Gates: `npm run typecheck` + `npm test` before every commit.

## ACCEPTANCE CRITERIA (v1)

1. Snap a real receipt → review screen pre-filled with merchant/date/total in < 2s.
2. Save item with 1yr warranty + 30d return window → three reminders scheduled, visible in item detail.
3. Kill network (airplane mode) → every feature still works.
4. Dashboard shows correct value-protected sum across ≥ 10 items.
5. Claim pack for any item shares an image + details payload the receiver can read.
6. 6th item on free tier → paywall; unlock → item saves.
7. Full test suite green; typecheck green; release APK boots on device.

## OBSERVABILITY

No remote telemetry (privacy promise). Local only: dev-mode logging, error boundary with user-visible fallback. Crash triage via local emulator logcat (as done for Receiptly).

## DEPLOYMENT

Local release build: `npx expo prebuild --platform android --no-install` → `android\gradlew assembleRelease` (ANDROID_HOME + local.properties; foojay patch). Emulator smoke test (Pixel 7 AVD "receiptly"). EAS build for store artifacts later. Play Store listing: "Warden: Warranty & Receipt Vault".

## OUT OF SCOPE (v1)

Cloud sync/accounts · iOS · expense tracking UI (engine retained, UI removed) · budgets · LLM/AI extraction (Gemini Nano = v2 candidate for the messy 8%) · Play Billing full integration (stubbed) · multi-currency conversion · warranty-card OCR (receipts only).

## PHASES

| Phase | Scope | Exit gate |
|-------|-------|-----------|
| 0 | Scaffold from Receiptly, rebrand, baseline green, publish repo | typecheck + 128 tests green; repo public |
| 1 | Items + reminders schema (migration 0002), repositories | headless CRUD tests green |
| 2 | Parser warranty-hint extraction | fixture tests green; accuracy unchanged on existing set |
| 3 | UI: review chips, item list/detail, dashboard, rebrand | manual flow on emulator |
| 4 | Reminder planner + scheduling (3 kinds) | planner unit tests green |
| 5 | Claim pack, freemium gate, onboarding, docs, release APK | acceptance criteria 1–7 |
