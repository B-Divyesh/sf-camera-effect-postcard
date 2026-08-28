# Postcard FX verification handoff — PASS

**Verified candidate:** `d54c21c7072df16e6353f90c6e81547c186b68f8`
**Live URL:** <https://camera-effect-postcard.sociobot.in/>
**Date:** 2026-08-28 UTC

## Release decision

**PASS.** Independent verification found no defects by severity (Critical, High, Medium, or Low) in the acceptance-contract scope. The live app matches the candidate build byte-for-byte across 16 public artifacts.

## Evidence

- Fresh detached clean checkout: `npm ci`, `npm test` (6 unit + 18 browser tests), `npm run lint`, `npm run typecheck`, `npm run build`, and production dependency audit all passed.
- Live desktop and 390 px checks passed: camera/no-camera flows, three effects, caption limit, timers 0 and 10, portrait 1200 × 1500 PNG, download, persistence, invalid backup/recovery, keyboard/focus, denial recovery, zero console/page errors, and same-origin-only networking.
- Backup import works with an image under the deployed CSP; reduced motion freezes the effect canvas; persistent 390 px targets meet 44 px height.
- Axe: 0 serious/critical findings across root/privacy/terms at both sizes. Offline root and privacy reload passed; an isolated exact-build worker update surfaced the in-app update toast.
- Live headers enforce CSP, HSTS, frame denial, camera-only permission, nosniff and referrer policy; documents revalidate and hashed assets are immutable.
- Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices, 100 SEO; FCP 1.0 s, LCP 1.2 s, TBT 190 ms, CLS 0.003, 94 KiB transfer.

Full methods, exact observations, budgets, and reproduction commands are in `.factory/verification-3.md`.

## Remaining note

Physical iOS Safari and Android Chrome camera/share-sheet smoke testing is recommended before broad promotion; automated Chromium synthetic-camera and all stated acceptance checks passed.
