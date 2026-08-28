# Independent verification 3 — PASS

**Work order:** `camera-effect-postcard-verify-3`
**Candidate:** `d54c21c7072df16e6353f90c6e81547c186b68f8`
**Live URL:** <https://camera-effect-postcard.sociobot.in/>
**Verified:** 2026-08-28 UTC

## Verdict

**PASS — release candidate accepted.** No Critical, High, Medium, or Low severity defects were found in the tested scope. This is a fresh verification; the prior production-only backup, reduced-motion, and touch-target failures are all fixed on the live candidate.

## Clean checkout and repository gates

- Created a new detached clone at exactly `d54c21c7072df16e6353f90c6e81547c186b68f8`; it started clean.
- `npm ci`: passed, 142 packages installed, 0 reported vulnerabilities.
- `npm test`: passed — Vitest **6/6** and Playwright **18/18** (desktop Chromium and Pixel 5 projects). The browser suite runs against the exact production build with the shipped response-policy configuration.
- `npm run lint`: passed with no ESLint findings. `npm run typecheck`: passed (`tsc --noEmit`). `npm run build`: passed and emitted `dist/`. Production dependency audit (`npm audit --omit=dev --audit-level=high`) reported 0 vulnerabilities.
- Static budgets: app JS 15,136 B raw / 6,178 B gzip; app CSS 12,416 B raw / 3,730 B gzip; legal CSS 1,230 B raw / 670 B gzip; preview WebP 58,548 B; no webfonts. All are within the supplied PWA budgets.

## Fresh live product exercise

Independent Playwright probes ran on the custom domain at 1366 × 900 and 390 × 844, capturing console and page errors and every HTTP(S) request.

- Synthetic permission-granted camera use opened one video track and zero audio tracks, supported the front/back switch, and stopped the stream after capture. Permission denial gave the explicit no-camera recovery message and moved focus to **Try without a camera**.
- The no-camera path selected Orbit bloom, Sun signal, and Party post; a 43rd caption character was constrained to the 42-character limit; timer 0 captured immediately; the 10-second boundary completed in 10.497 s.
- Each result and downloaded/restored image was a 1200 × 1500 PNG. The latest postcard persisted across reload.
- A live image-bearing backup was exported, local result deleted, then the exact JSON imported successfully under `connect-src 'self'` with the message “Local backup imported.” Existing preferences survived an invalid timer backup. A deliberately malformed local settings value was cleared on reload with actionable recovery copy, and capture remained usable.
- Keyboard-only use reached the skip link, preview/effect/capture flow and result download; the visible import control rendered its designed 3 px focus outline. At 390 px, checked persistent and primary controls were at least 44 px high (primary controls 358 × 50 px; wordmark/footer controls 44 px high). Visual review found a legible portrait-safe stage and no clipping or overlap at either size.
- With `prefers-reduced-motion: reduce`, two canvas snapshots 700 ms apart were byte-identical. Normal motion remains available outside that preference.
- There were **zero console errors and zero page errors**. Runtime HTTP(S) requests used only `https://camera-effect-postcard.sociobot.in`; no analytics, trackers, remote fonts/scripts, upload traffic, or third-party runtime content was observed. Source review confirms user-triggered camera access uses `audio: false` and local storage is limited to browser localStorage, IndexedDB, Cache Storage, and user-requested downloads.

## Accessibility, PWA, deployment, and policy

- Fresh Axe scans of `/`, `/privacy/`, and `/terms/` at both required viewports found **0 serious and 0 critical** violations in all six scans. The live app has a title, `lang=en`, one h1, main landmark, labeled controls, and visible focus.
- Live PWA verification: a controlled service worker reloaded root offline, produced a 1200 × 1500 no-camera PNG offline, and opened cached `/privacy/`. An isolated copy of the exact built shell, served first with the candidate worker then an updated worker revision, displayed “A fresh version is ready.” with an active controlled client and no errors.
- The live manifest has standalone display, portrait orientation, versioned start URL, matching paper-theme colors, and 192/512/maskable icons.
- SHA-256 comparison matched **16/16** public artifacts to this exact local build: root, privacy, terms, offline page, manifest, service worker, robots, sitemap, SVG plus three PNG icons, two CSS files, app JS, and preview WebP. The deployed URL therefore matches the tested candidate.
- Live responses enforce HSTS, strict same-origin CSP with `frame-ancestors 'none'`, camera-self-only Permissions-Policy (microphone disabled), `X-Frame-Options: DENY`, `nosniff`, and strict-origin referrer policy. Documents/service worker use `max-age=0, must-revalidate`; hashed assets use `max-age=31536000, immutable`.
- Fresh Lighthouse 12.8.2 mobile against the live URL: Performance **97**, Accessibility **100**, Best Practices **100**, SEO **100**; FCP 1.0 s, LCP 1.2 s, TBT 190 ms, CLS 0.003, total transfer 94 KiB, and no third-party summary.

## Remaining non-blocking coverage note

Automated camera checks use Chromium's synthetic video device. A physical iOS Safari and Android Chrome camera/share-sheet smoke test remains prudent before large-scale promotion, but no acceptance-contract failure was found.

## Reproduce

```bash
npm ci
npm test
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```
