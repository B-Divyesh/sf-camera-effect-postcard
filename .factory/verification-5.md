# Independent verification 5 — Make a private camera postcard

**Work order:** `camera-effect-postcard-verify-5`  
**Verdict:** **PASS**  
**Finding count:** **0**  
**Untested public-claim count:** **0**  
**Implementation reviewed:** `66af9efecf647734fab57bceddc27d43ee20098c`  
**Documentation baseline reviewed:** `e34fddbd85a512518d5dcfc7027e7bed34e25672`  
**Live URL:** <https://camera-effect-postcard.sociobot.in/>  
**Verified:** 2026-09-05 UTC

## Verdict

**PASS.** No Critical, High, Medium, or Low findings were found, and every public claim has an independently replayed, passing command. The live runtime matches the reviewed implementation build. `e34fddb` is documentation-only; the reviewed product implementation remains `66af9ef`.

## Job, audience, and first action

The job is to make a private camera postcard and download it as a PNG. It is for friends and event hosts who want a playful photo without sending video to a social platform. The first action is **Try it with sample data**.

Fresh Chromium contexts at 1366 × 900 and 390 × 844 showed the exact h1, audience sentence, and action at scroll position zero. Both had the action fully visible before scrolling.

## Clean-checkout checks

A new detached checkout at `66af9ef` was created under `/work/qa-camera-effect-postcard-verify-5.pxCa2Q`, then set up with `npm ci` (142 packages; audit reported 0 vulnerabilities). The following passed:

```bash
npm test
npm run test:claims
npm run lint
npm run typecheck
npm run build
npm audit --omit=dev --audit-level=high
```

- `npm test`: 5 Vitest tests and 68 Playwright tests passed.
- `npm run test:claims`: 44 browser executions passed.
- Lint, strict TypeScript, production build, and production dependency audit all passed. `dist/` was produced.
- The build has 22 claim entries, 22 unique `@claim:` tags, no missing tag, and no extra tag. Each of the 22 commands from `.factory/claims.json` was run separately; every one passed in both mobile and desktop Chromium (44 passing executions).
- The app bundle is 16.37 KB raw / 6.61 KB gzip; CSS is 13.98 KB raw / 3.97 KB gzip; the original preview artwork is 58.55 KB. There are no webfonts.

## Live product checks

- Fresh phone and desktop flows entered the demo, showed the persistent **Demo — sample data, nothing is saved** label, Mina and Jo's garden-party caption, and a populated 1200 × 1500 result. At phone width, the banner was 374 × 88.19 CSS px.
- The demo download was `postcard-fx.png` with a valid PNG signature and 1200 × 1500 IHDR dimensions. Reset restored the starter caption. A real postcard made before demo use retained its caption and restore control after **Start for real**.
- A synthetic live camera requested `audio: false`, made a 1200 × 1500 PNG, and stopped its video track. The no-camera flow also completed. A 43-character caption was constrained to 42 characters. Invalid backup input produced the recovery message, and corrupt saved preferences were reset on reload.
- Keyboard testing confirmed the skip link is first focus and moves focus to main. Reduced-motion canvas output remained unchanged over 700 ms.
- A fresh controlled context reopened the populated demo offline. Runtime HTTP(S) requests stayed on the product origin only.
- `verify-url.sh` passed for root, demo, privacy, and terms. Twelve live Playwright Axe scans (root, demo, privacy, terms, offline, and 404 at both sizes) had zero serious and zero critical issues. Each checked page had one h1, one main landmark, and its route title.
- `/does-not-exist` returned the designed HTTP 404 page. Its expected browser 404 resource message was excluded from console-error findings.
- Root and demo responses have same-origin CSP with `frame-ancestors 'none'`, HSTS, camera-only permissions, frame denial, `nosniff`, and strict-origin referrer policy. Hashed JavaScript is immutable cached.
- SHA-256 comparison matched all 20 public deployed artifacts to local `dist/`; `staticwebapp.config.json` is deploy configuration and is not a public artifact.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Verification 1: malformed backup recovery, import focus, response policy and caching | Resolved. Invalid backup and corrupt-settings recovery, the focus regression, and live headers/cache checks passed. |
| Verification 2: image-bearing backup under CSP, reduced motion, 44 px persistent targets | Resolved. The production-policy browser suite passed; live reduced-motion output was stable; mobile target regression passed in the clean suite. |
| Review 1 F1–F7: demo, claim registry, plain first screen, 404, navigation, social metadata, URL smoke script | Resolved. Fresh live demo/first-screen/404/route checks and `verify-url.sh` passed; registry and metadata/navigation regressions passed in the clean suite. |
| Review 2 F1: share, face-following, and face-position-storage claim coverage | Resolved. The three registered claim commands (`native-share`, `face-following`, `no-face-position-storage`) each passed in both projects. |
| Review 2 F2: obstructive phone banner | Resolved. Fresh phone measurement is 88.19 px high with a 374 px-wide label row. |
| Review 2 F3: mobile CLS | Resolved by the install-shift regression in the 68-test clean suite. A new standalone Lighthouse run was not recorded because this verifier container's Chrome process crashed; this is not an untested public claim or a product failure. |

## Scope notes

This is a static local-first PWA. Backend tenant isolation, restart, health-check, and 429/Retry-After checks do not apply. No AI feature is useful for this private on-device camera job. The only prudent future check is a physical iOS Safari and Android Chrome camera/share-sheet smoke test; it is not a release finding and does not leave a declared claim untested.
