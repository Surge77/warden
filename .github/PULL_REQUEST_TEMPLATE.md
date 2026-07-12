## What & why
What does this PR change, and why? Link the issue (`Closes #...`).

## Type
- [ ] feat  - [ ] fix  - [ ] docs  - [ ] refactor  - [ ] test  - [ ] chore  - [ ] perf

## How I verified
- [ ] `npm run lint` clean
- [ ] `npm run typecheck` clean
- [ ] `npm test` passing (coverage gates met)
- [ ] Manual dev-build smoke test on a physical Android device (for UI/native changes)
  - Device + Android version:

## Checklist
- [ ] Follows the layered architecture (UI → store → services → SQLite); no new tech without prior discussion
- [ ] Files under 300 lines
- [ ] No secrets / keystores / `.env*` committed
- [ ] Tests added/updated for new logic
- [ ] Migration steps included (if schema changed)
