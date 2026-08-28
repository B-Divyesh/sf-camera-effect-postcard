# Postcard FX visual thesis

## Direction: kinetic generative geometry

Postcard FX should feel like a tiny printmaking machine, not a social network or a
camera utility. A live portrait sits inside a cream paper stage while geometric
marks orbit, stamp, and frame it. The irregular composition suggests a handmade
postcard; exact controls and a dark ink frame keep the camera task obvious.

The single visual mode is a warm daylight paper studio. This is intentional: the
cream capture border is part of the exported artifact, and a dark theme would
make the live preview and its final postcard feel like different products. All
surfaces are painted explicitly.

## Tokens

- `paper #FFF8E8`: background and exported postcard stock.
- `paper-deep #F2E6C9`: recessed controls and quiet regions.
- `ink #17233B`: primary text, outlines, and camera surround (13.8:1 on paper).
- `ink-soft #4E5869`: secondary text (6.5:1 on paper).
- `cobalt #2453D4`: primary action and focus geometry (6.3:1 with white).
- `coral #B83A3A`: energetic stamps and danger messages (5.5:1 on paper).
- `acid #C7E84B`: highlight only, always paired with ink (10.5:1).
- `success #176B4A`, `warning #805500`, `danger #A22C35`: state colors with
  symbols or copy, never color alone.

## Typography and spacing

Display copy uses Georgia, the local serif found on every target platform, for
the cheerful authority of a printed card. UI and body copy use the local
system-sans stack for compact, fast controls. No font files or third-party font
requests ship. Type steps: 13, 16, 20, 28, and fluid 42–68 px; body is never
below 16 px. The spacing grid is 4 px with primary intervals of 8, 12, 16, 24,
32, 48, and 64 px. Text measures cap at 68 characters.

## Interaction grammar

- Thick 2 px ink outlines and 0/6 px offset shadows make controls feel like
  movable print blocks. Pressing a block closes the shadow physically.
- The camera is the dominant stage. Setup copy lives beside it on wide screens
  and collapses above it at phone width; secondary storytelling drops below.
- Effect choices are labeled swatches, not mystery icons. Selected controls
  gain an inset acid marker and explicit `Selected` state for assistive tech.
- The portrait guide is a 4:5 rounded rectangle with clear top/side markers;
  capture uses cover-cropping from the real video dimensions, preventing the
  vertical squash described in the research.
- No-camera preview is a first-class path using an original abstract portrait,
  so camera denial or absent hardware does not end the experience.

## Motion policy

UI state transitions take 180–240 ms and use only opacity and transforms.
Effect marks drift with slow, bounded motion and the shutter contracts once at
capture. Countdown changes are announced and use one scale pulse per number.
Nothing flashes or loops faster than 3 Hz. Under `prefers-reduced-motion`, all
drift, countdown scale, and shutter movement are removed; states change by
opacity or instantly. A user can also pause live motion with the visible
“Freeze motion” toggle.

## Asset plan and provenance

- `public/art/geometry-portrait.webp`: generated abstract mannequin portrait
  for the no-camera preview and onboarding illustration; it does not depict a
  real person and does not imply face recognition.
- PWA icons and interface symbols are original hand-authored SVG/canvas
  geometry in this repository.
- Effect overlays are deterministic Canvas 2D shapes generated locally from
  coarse, ephemeral face-position estimates; no frames or landmark data leave
  the device.

### Generation prompt sheet

Use case: stylized-concept. Asset: phone-first no-camera preview illustration.
Subject: one abstract, friendly, gender-neutral mannequin bust built from flat
paper shapes, centered and facing forward, shoulders visible. World: tactile
cut-paper postcard studio with sparse circles, rays, arcs, and one postage-like
corner shape. Materials: matte paper, screen-print ink, faint fiber grain.
Light: soft frontal studio light, no dramatic shadows. Lens/composition:
portrait 4:5 composition with generous edge breathing room and face centered in
the upper-middle for overlay alignment. Palette words: warm cream paper, deep
navy ink, cobalt blue, brick coral, acid-lime details. Negative list: no real
person, no photoreal skin, no text, no letters, no numbers, no logo, no brand,
no watermark, no extra face, no distorted anatomy, no gradient, no device UI.

Generated with the factory Azure image deployment (`factory-image`) on
2026-08-28. The output is original to Postcard FX and reviewed for text
artifacts, unintended marks, anatomy, and palette consistency. The source PNG
and prompt sidecar live in `assets/src/`; the shipped WebP is optimized to stay
below 300 KB. Generated imagery is disclosed in the footer.

