# Security Policy

## Supported versions
Warden is pre-1.0. Only the latest `main` and most recent tagged release receive security fixes.

| Version | Supported |
|---------|-----------|
| `main`  | ✅ |
| latest tag | ✅ |
| older   | ❌ |

## Privacy & threat model
Warden is **on-device and offline by design**:
- No backend, no API keys, no authentication — there is no server to attack.
- Receipt images and the item database stay in app-private storage and are **never uploaded**.
- The only runtime permission is the **camera** (and media read for gallery import).

The practical risks are local: another app reading shared storage, or sensitive receipt data in logs. Mitigations: app-private storage, no PII in release logs, parameterized DB access.

## Reporting a vulnerability
**Do not open a public issue for security problems.**

Email **tejasdeshmane66@gmail.com** with:
- a description and impact,
- steps to reproduce,
- affected version/commit.

You'll get an acknowledgement within **5 business days**. Validated issues are fixed on a best-effort basis (solo-maintained project) and credited unless you prefer otherwise.

## Out of scope
- Issues requiring a rooted/compromised device or physical access.
- Vulnerabilities in third-party dependencies already tracked upstream (please link the upstream advisory).
