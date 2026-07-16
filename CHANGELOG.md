# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · Versioning: [SemVer](https://semver.org/).

## [Unreleased]
### Added
- Dashboard redesign: vault dial (share of value still protected) and deadline docket (next return/expiry deadlines via new pure `nextDeadline` helper); ink-green theme pass carried into the splash background.
- Warranty domain: items carry name, return window, and warranty length; migration 0002 adds the fields plus a `reminders` table.
- Parser detects warranty hints on receipts ("1 YEAR WARRANTY", "WARRANTY: 12 MONTHS") and pre-fills the review screen.
- Review/edit screens: item name input, return-window chips (7/15/30d/custom), warranty chips (6mo/1yr/2yr/custom).
- Item detail: RETURN BY / WARRANTY countdown rows; claim-pack share button.
- Dual-deadline local notifications per item: return-window reminder, warranty-expiry reminder, and a test-before-expiry nudge 30 days out — scheduled on save, rescheduled on edit, cancelled on delete.
- Dashboard leads with **value protected**: total purchase value under warranty, items covered, expiring-soon count.
- Claim pack: self-contained HTML proof-of-purchase (details + embedded receipt photo) shared via the system sheet.
- Freemium gate: free tier tracks 5 items; Warden Pro toggle (local stub — Play Billing before store release) unlocks unlimited.
- Backup format now round-trips reminders and clears stale OS notification ids on restore.
- Project scaffolded from Receiptly v0.2.0 engine: on-device ML Kit OCR pipeline, receipt parser (91.7% amount-accuracy baseline), SQLite + Drizzle data layer, JSON backup, biometric app lock, thermal-receipt design system.
- Warden project plan (docs/PLAN.md): warranty vault domain, phased roadmap.

### Fixed
- Disabling the daily reminder no longer cancels every scheduled notification (would have silently killed warranty deadline reminders).
