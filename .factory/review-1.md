# Review 1: Make a private camera postcard

**Verdict: FAIL.** There are 7 findings and 18 untested public claims. This
review is not a release approval.

**Live URL:** <https://camera-effect-postcard.sociobot.in/>

**Reviewed:** 2026-09-05 UTC

**Implementation reviewed:** `9afb13d733547022a06fbac08eb1cb84afeeb30d`

**Documentation revision:** `b06b879e6564c11b3772c65718d82092fceab9f5`

`9afb13d` is the latest implementation commit. The later commits through
`b06b879` change only `.factory/handoff.md` and `.factory/verification-3.md`.
The current live files matched the local build from this revision: 16 of 16
public artifacts had matching SHA-256 hashes.

## Job, audience, and first action

Job: turn a camera moment into a shareable 4:5 PNG without uploading video.

Audience: friends and event hosts who want a phone-first camera effect without
installing virtual-camera software or giving a social platform their video.

Required first action: **Try it with sample data**. The live first screen instead
offers **Use my camera** and **Try without a camera**. It has no sample-data
action.

## Findings

### F1 — High — There is no one-click demo sandbox

The first screen has no **Try it with sample data** action. Fresh desktop and
Pixel 5 contexts found no demo action or persistent `Demo — sample data,
nothing is saved` banner. `/demo` and `/?demo=1` both render the ordinary maker,
with no banner, Reset demo, or Start for real action. Creating a postcard at
`/demo` writes to the ordinary `postcard-fx` IndexedDB database, rather than a
separate `demo:` namespace. `.factory/demo.md` is also absent.

This fails the demo-sandbox contract and does not prove that a try-out cannot
change real local data.

### F2 — High — The required claim registry is missing

`.factory/claims.json` does not exist. Therefore there are no declared claim
commands to run and no `@claim:<id>` tests for public promises. The following
18 distinct reliance claims are unlisted and untested under the required claims
contract: free use; phone-first use; portrait-safe crop; no account; no upload;
works offline after the first visit; frames stay on device; camera stops when
the tab closes; camera stops after capture; audio is never requested; three
effects; optional on-device face positioning; 4:5 PNG output; PNG download;
local persistence across refresh; local export/import; no analytics or
third-party runtime content; and no face identification.

Some general Playwright tests cover parts of these behaviours, but the contract
requires one listed, tagged command per claim using the demo entry point. The
missing registry makes all 18 public claims untested for release purposes.

### F3 — Medium — The first screen does not state the job or audience in plain words

The only landing-page h1 is `A little geometry for a big hello.` It does not say
what the product does. The supporting sentence names neither friends nor event
hosts. The eyebrow `Private camera play`, the h2 `Your face is not the product.`,
the result label `Fresh from the press`, and both legal-page h1 values also use
brand or mood language instead of useful section names. `.factory/copy-audit.md`
is absent, so there is no required word-count and banned-word audit.

### F4 — Medium — Unknown URLs do not show a 404 page

`/does-not-exist` returns HTTP 200 and the landing page, including its landing
title and h1. There is no `/404.html` or response override. An intentional HTTP
404 would be acceptable; returning an unrelated successful page is not a
designed 404 path and breaks the site-structure contract.

### F5 — Medium — Required header navigation is absent and inconsistent

The root header has a wordmark and status only. It contains no navigation to
Demo, the maker, or Privacy. The privacy and terms headers use a separate
wordmark/back-link pattern. This misses the required consistent header and
real-URL navigation, including the required Demo route.

### F6 — Low — Required social metadata is missing

The landing document has a title, description, canonical URL, icons, and theme
colour, but no Open Graph or Twitter-card tags and no 1200 × 630 social image.
This is required site metadata and affects shared-link previews.

### F7 — Low — The required URL smoke-check script is not available

No `verify-url.sh` exists in this clean checkout or on the command path, so the
specified worker check could not be run. The equivalent live checks below were
performed, but the required reproducible command is missing.

## Checks that passed

- Clean supplied checkout: `npm ci` passed with 0 vulnerabilities.
- `npm test` passed: 6 Vitest tests and 18 Playwright tests.
- `npm run lint`, `npm run typecheck`, `npm run build`, and
  `npm audit --omit=dev --audit-level=high` all passed. `dist/` was produced.
- Fresh desktop (1366 × 900) and phone (Pixel 5) browser contexts loaded the
  live app without console or page errors. The no-camera path created a
  populated 1200 × 1500 PNG on both devices.
- A synthetic granted-camera check opened one video track and zero audio tracks,
  captured a 1200 × 1500 PNG, and had no page errors. A forced permission denial
  gave the recovery message and moved focus to **Try without a camera**.
- The 42-character caption boundary held. A 10-second timer completed in
  11.828 seconds and produced a 1200 × 1500 PNG. An invalid backup was rejected
  while the existing result remained available.
- An offline controlled reload worked after the first visit; the no-camera path
  still made a 1200 × 1500 PNG with no page errors.
- Live reduced-motion canvas screenshots 750 ms apart were identical. At 390 px,
  the checked persistent and primary targets were at least 44 px high. The
  visible backup-import label had a 3 px cobalt focus outline.
- Playwright Axe scans of `/`, `/privacy/`, and `/terms/` at desktop and phone
  sizes reported no violations. Each had `lang=en`, one main landmark, one h1,
  and no image missing an alt attribute. `npx @axe-core/cli` was attempted but
  could not start because its Selenium runner could not find a Chrome binary;
  the permitted Playwright Axe alternative was used successfully.
- Request capture for the fresh live product flow used only
  `https://camera-effect-postcard.sociobot.in`. The live response has CSP,
  camera-only permissions policy, HSTS, frame denial, nosniff, and referrer
  policy. Hashed app assets are immutable and the live build matches the latest
  implementation artifact.

## Earlier findings

The failures recorded in `verification.md` and `verification-2.md` are resolved
in the current live implementation: malformed backup recovery, image-bearing
backup import under CSP, reduced-motion canvas freezing, the import focus
indicator, and 44 px persistent touch targets all passed the current checks.
The earlier caching and response-policy hardening also remains present.

## Required work before another review

1. Add a `/demo` or `?demo=1` route with a first-screen **Try it with sample
   data** action, a realistic populated sample, persistent demo banner, Reset
   demo and Start for real controls, and a separate `demo:` storage namespace.
2. Add `.factory/demo.md` and `.factory/claims.json`; register every public
   claim above with exactly one `@claim:` demo-entry test and command.
3. Rewrite the first screen and legal headings in plain words. The h1 must name
   making a private camera postcard; name friends and event hosts in the first
   sentence. Add the required copy audit.
4. Add a designed `/404.html` with an actual 404 response, consistent header
   navigation, and the required Open Graph/Twitter metadata and social image.
5. Provide and document `verify-url.sh`, then rerun the full clean-checkout
   suite and every claim command.
