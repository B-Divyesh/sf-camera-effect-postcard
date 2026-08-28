# Independent verification 2 — FAIL

**Work order:** `camera-effect-postcard-verify-2`

**Candidate:** `088c05184202e45f521eb077f4b7c9992adfddc1`

**Live URL:** <https://camera-effect-postcard.sociobot.in/>

**Verified:** 2026-08-28 UTC

**Verdict:** **FAIL — do not release this candidate.**

The deployed app is byte-identical to the candidate build and its primary
camera/no-camera, PNG, persistence, offline, privacy, accessibility-scan, and
performance paths are healthy. However, a backup exported by the live app
cannot be imported after it contains a postcard. This is a production-only
regression caused by the new CSP. Reduced-motion users also still receive the
continuously moving canvas effect. Both violate explicit acceptance criteria.

## Defects

### P1 — production rejects its own image-bearing backup

Reproduced at 390 × 844 in a clean Chromium context:

1. Open the live app, choose no-camera preview, and make a postcard.
2. Select **Export local backup**. The downloaded valid v1 JSON contains the
   current settings and a `data:image/png;base64,...` postcard.
3. Delete the local postcard, then import that exact downloaded file.
4. The live app reports “That file is not a valid Postcard FX backup.” and does
   not restore the result.

The browser records two console errors: the connection to the PNG `data:` URL
violates `connect-src 'self'`, and Fetch refuses to load it. The app converts a
backup image with `fetch(dataUrl)` in `src/storage.ts`, while the deployed
`Content-Security-Policy` permits only `'self'` in `connect-src`.

This is conclusively deployment-specific: the identical workflow against the
exact `dist/` build under `npm run preview` reports “Local backup imported.”,
restores the image, and produces no console/page errors. Invalid backups are
still rejected safely and do not overwrite settings.

Recommended repair: decode the base64 locally without Fetch (preferred), or
make the CSP compatible with this intentionally local conversion. Add an E2E
test that exports, deletes, and reimports a real image-bearing backup while the
production response policy is active.

### P2 — reduced-motion preference does not stop canvas animation

In a browser context emulating `prefers-reduced-motion: reduce`, the CSS
countdown animation correctly computes to `0.00001s`, but two PNG snapshots of
the Orbit effect canvas taken 700 ms apart differ. `render()` passes only the
manual “Freeze motion” checkbox to `drawEffect`; it never incorporates the OS
motion preference. Orbit points, Sun signal rays, and Party post marks therefore
continue to move until the user manually freezes them.

Recommended repair: make the canvas render path treat the media query as
frozen, react to changes in that query, and cover stable canvas output in a
reduced-motion browser test.

### P3 — persistent navigation links miss the 44 px touch-target contract

At the required 390 px viewport, the home wordmark hit area measures 155 × 38
CSS px and the footer Privacy and Terms links measure 58 × 24 and 47 × 24 CSS
px. They are spaced apart, but their own hit areas do not meet the work order's
44 × 44 minimum. The primary maker controls and their wrapping labels do meet
the intended target size.

## Clean checkout and repository gates

- Began with an empty worktree at the requested SHA. Both local `HEAD` and
  `origin/main` resolved to `088c05184202e45f521eb077f4b7c9992adfddc1`.
- Environment: Node `v22.23.2`, npm `10.9.8`.
- `npm ci`: 60 packages installed; audit reported 0 vulnerabilities.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilities.
- `npm test`: PASS. Vitest passed 5/5 tests across geometry, storage, and
  deployment policy; Playwright 1.58.2 passed 10/10 tests across desktop
  Chromium and Pixel 5.
- `npm run build`: PASS. This is the exact production command and includes
  `tsc --noEmit`; Vite emitted `dist/`. There is no lint script in the
  repository.
- Production output: app JS 14,855 B raw / 6,041 B gzip; main CSS 12,317 B raw
  / 3,712 B gzip; legal CSS 1,142 B raw; preview WebP 58,548 B. No font files
  ship. These are within all supplied static-product budgets.

## Product exercise

Fresh independent Playwright probes were run against the live deployment at
390 × 844 and 1366 × 900, in addition to the repository suite.

- The no-camera path selected all three effects and created valid PNGs with a
  representative caption and with the 42-character maximum. Attempting a 43rd
  character was prevented.
- The result image and downloaded PNG both measured exactly 1200 × 1500; the
  PNG signature and IHDR dimensions were independently checked.
- Timer Off completed immediately; the 10-second boundary produced a result in
  11.289 seconds with no runtime error.
- The latest postcard survived reload, “Open my last postcard” restored it,
  canceling deletion retained it, and confirming deletion removed it. The
  unsupported native-share path gave the actionable PNG-download fallback.
- Syntactically invalid JSON, wrong product, invalid timer, fake PNG, and the
  prior `settings: "corrupt"` shape were rejected. Existing settings remained
  unchanged, and manually corrupt persisted settings were cleared with visible
  recovery copy; capture continued afterward.
- Chromium's synthetic camera exercised the permission-granted path, camera
  switching, capture, and shutdown. The stream had one video track and zero
  audio tracks; it was cleared after capture. A separately injected permission
  denial moved focus to the no-camera option and explained recovery.
- Visual review of the initial and completed states at desktop and 390 px found
  no clipping, overlap, distorted portrait output, or unusable controls. The
  product-specific printmaking design remains clear and responsive.

## Accessibility and interaction

- The factory `verify-url.sh` passed: HTTPS 200, correct title and `lang`, one
  `<h1>`, a `<main>`, complete image alt text, no unlabeled buttons, no load
  console/page errors, and an 871 ms smoke-load measurement.
- Fresh Axe scans on `/`, `/privacy/`, and `/terms/` at desktop and 390 px:
  **0 serious and 0 critical findings** on all six runs.
- Keyboard-only preview/effect/capture/download passed. The skip link was first
  in the tab order, result focus moved to Download PNG, ordinary controls had a
  3 px visible focus outline, and the visually hidden import input painted the
  same outline on its visible label.
- Focus was not trapped, controls exposed native roles/states, async status was
  announced, zoom was not disabled, and no flashing behavior was observed.
- The reduced-motion and touch-target exceptions are recorded above.

## Privacy, networking, and response policy

- Runtime request capture across main and legal pages, camera/no-camera flows,
  export, errors, and offline work found only
  `https://camera-effect-postcard.sociobot.in` plus local `blob:`/`data:` URLs.
  Lighthouse likewise reported 0 third-party requests.
- Source inspection found no analytics, ads, trackers, remote fonts/scripts,
  uploads, WebSockets, or audio request. `getUserMedia` is action-triggered and
  explicitly uses `audio: false`. App state is limited to localStorage,
  IndexedDB, Cache Storage, and user-requested downloads.
- Live root responses include HSTS, enforcing CSP with
  `frame-ancestors 'none'`, `Permissions-Policy` limiting camera to self and
  disabling microphone/geolocation/payment/USB, `X-Frame-Options: DENY`,
  `nosniff`, and strict-origin referrer policy.
- HTML, service worker, manifest, legal/offline pages, and icons use
  `max-age=0, must-revalidate`. Hashed JS, CSS, and preview artwork use
  `max-age=31536000, immutable`. The CSP itself causes the P1 above.

## Deployment identity, PWA, and performance

- Every served candidate artifact was downloaded and SHA-256 compared: root,
  privacy, terms, offline, manifest, service worker, robots, sitemap, four
  hashed assets, SVG icon, and three PNG icons — **16/16 byte matches**. This
  confirms the live deployment is the tested candidate rather than the prior
  failed build.
- Chrome parsed the live manifest with no errors or installability errors. It
  recognized standalone display, portrait orientation, versioned start URL,
  theme/background colors, and 192/512/maskable icons; on-disk icon dimensions
  match their declarations.
- The live service worker controlled reloads with cache
  `postcard-fx-9fc4d09b8171` and 14 precached shell URLs. Offline root reload,
  preview capture, PNG result, network-state feedback, and a precached privacy
  page all worked without console/page errors.
- An isolated real service-worker revision changed the cache to `qa-update-2`,
  surfaced “A fresh version is ready.”, exposed the Reload action, activated,
  and removed the old cache.
- Lighthouse 12.8.2 mobile: Performance 98, Accessibility 100, Best Practices
  100, SEO 100; FCP 1.2 s, LCP 1.4 s, TBT 150 ms, CLS 0.003. Initial transfer
  was 72 KiB (6.2 KiB script, 3.8 KiB CSS, 58.7 KiB image), with no font or
  third-party transfer. Lab Lighthouse does not report field INP; TBT remains
  inside the supplied 200 ms interaction proxy budget.

## Release decision

**FAIL.** Repair and regression-test the production backup round trip and
reduced-motion canvas behavior before release. Increase the remaining small
navigation hit areas while addressing the accessibility pass.
