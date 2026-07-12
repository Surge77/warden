# Warden — Warranty & Receipt Vault

**Snap a receipt. Warden reads it, watches the deadlines, and reminds you before you lose money.**

Warden is an offline-first Android app that tracks your purchases, return windows, and warranties. Photograph a receipt and on-device OCR extracts the merchant, date, and total — then Warden schedules reminders so you never miss a return window or let a warranty expire unused.

## Why Warden

- **100% on-device.** OCR runs locally (ML Kit). No account, no cloud, no analytics. Your purchases are nobody's business.
- **Two clocks per item.** Return window *and* warranty expiry — most trackers only watch one.
- **Test-before-expiry nudge.** 30 days before a warranty dies, Warden tells you to test the product while a claim is still possible.
- **Claim pack.** One tap shares the receipt image + purchase details when you need to make a claim.
- **Value protected.** The dashboard shows the total purchase value still under warranty.

## Features

- Camera capture or gallery import → on-device OCR → auto-filled merchant, date, total
- Warranty length chips (6mo / 1yr / 2yr / custom) + return window (7/15/30 days / custom)
- Local notification reminders: return deadline, warranty expiry, test-before-expiry
- Search & filter (merchant, category, expiring soon)
- JSON backup export/import via share sheet — your data is portable
- Optional biometric app lock
- Free tier: 5 tracked items · Pro (one-time): unlimited + claim pack + custom reminder timing

## Stack

Expo SDK 56 · React Native 0.85 · React 19 · TypeScript (strict) · Expo Router · ML Kit Text Recognition · expo-sqlite + Drizzle ORM · Zustand · Jest

Architecture: pure-TS core (parser, warranty date math — no React/native/DB imports, fully unit-tested) behind a thin UI shell; repository pattern with injected DB (expo-sqlite on device, better-sqlite3 in tests).

## Development

```sh
npm install
npm run typecheck   # tsc --noEmit
npm test            # jest
npm start           # expo dev client
```

Android release build (local):

```sh
npx expo prebuild --platform android --no-install
# Gradle 9 note: patch node_modules/@react-native/gradle-plugin/settings.gradle.kts
# foojay-resolver-convention 0.5.0 -> 1.0.0 (facebook/react-native#55781); reapply after npm install
cd android && ./gradlew assembleRelease
```

See [docs/PLAN.md](docs/PLAN.md) for the full project plan and phase breakdown.

## Privacy

Warden makes no network calls in any core flow. Receipts, items, and reminders live in a local SQLite database and app-private storage only. See [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE)
