---
name: ink-marbling-canvas
description: Use for marbling or ink-wash generative canvas art.
version: 1.0.0
author: hermes-agent
license: MIT
metadata:
  hermes:
    tags: [generative-art, canvas, marbling, turbulence, flow-field]
    related_skills: [html-artifacts, claude-design]
---

# Ink marbling on canvas (flow-field filaments)

## When to Use

- The user asks for marbling, ink wash, suminagashi, sumi-e, liquid ink, or "la marée"
  generative art on a canvas.
- Any generative canvas piece that needs LONG fluid filaments rather than scratchy strokes.
- Do not use for text-field or particle-glow pieces — those want a different field model.

Builds ink-wash / suminagashi / marbled art: long luminous filaments, pigment bands,
a pointer-driven vortex, and drops of colour on click.

## The core technique (get this right first)

**Persistent canvas + slow fade.** Each frame, fill the whole canvas with the background
at a low alpha (0.02–0.06), then draw one short segment per particle. The low-alpha fill
IS the trail: alpha controls trail length, lower alpha = longer trails.

**Divergence-free field.** Build a stream function and take its perpendicular:
`psi = sum A_i sin(kx*x + ky*y + w*t)`, `velocity = (dpsi/dy, -dpsi/dx)`.
Divergence-free flow never collapses into sinks — this is what produces marbling.
An advected scalar field gives you scratches, not marbling.

## Pitfalls that cost real iterations

- **Particles with per-particle history redrawn as polylines** → short scratchy strokes.
  Do NOT keep a history buffer; let the fading canvas accumulate the filament.
**Two pigments only.** Raw value noise clusters mid-range, so a naive mapping to a
palette only ever shows ~2 hues. Measure the field's min/max across the sheet and
normalise against that extent, then apply a gentle S-curve.

**Particle trails read as scratches; advect a DYE FIELD for real marbling.**
Two distinct architectures — do not mix them:
- *Particle* + persistent canvas + slow fade → long luminous filaments (the
  technique above). Fine for ink strokes.
- *Scalar field* advected semi-Lagrangian → genuine marbling: concentric rings
  deform into ribbons, which is what suminagashi actually looks like.
For the field version: seed `u` with concentric rings (`u = r/ringWidth`), then
advect `u` by the divergence-free velocity. Colour = `palette[floor(u)]`,
ink presence = a profile inside each band. Sample `u` BILINEARLY at render
resolution (2x the sim grid) so band edges are smooth curves, not pixel stairs.
Catmull-Rom interpolation of the backtrace preserves contours far better than
bilinear, at ~4x the cost.

**Do NOT "sharpen" the field with an unsharp mask** (`u + k*(u - blur)`): it
amplifies Nyquist noise and diverges to Infinity within a few hundred frames.
Clamp the result or skip it.

**Never add pointer FORCE to the velocity field.** A drag compresses the
dye field into flat slabs. Instead warp the SOURCE space (rotate + pull the
sample position around the pointer) — that is a diffeomorphism, so ribbons
twist and stretch but never collapse. Give the hand an energy value that decays
to zero when the pointer stops, so the ink settles.

**Flat slabs and muddy colour**: an ink band must be OPAQUE where it exists.
Semi-transparent pigment over a dark ground turns olive (measure it: ~135,101,53
for gold at alpha .55 on navy). Make the alpha fall off sharply to zero outside
the composition instead of fading to a translucent veil.

**Paper mode: use `source-over`, not `multiply`.** `multiply` accumulates every
frame — the ink multiplies onto itself and turns to grey mud. On paper, lay an
OPAQUE background each frame, then draw the ink once on top.
- **Paper mode goes muddy olive.** `multiply` + red and green = olive mud. Keep the paper
  palette free of green (sumi/sepia/indigo/vermillion only) and cut particle count to
  ~0.6x — overlapping multiply strokes accumulate into a flat wash.
- **Night mode goes white.** `lighter` composite saturates to white fast. Use
  `source-over` for night (preserves hue) and `multiply` for paper (darkens like real ink).
- **Value noise needs an explicit stretch** `(v-0.5)*k+0.5` or bands never separate.

## Verification hooks

Expose `window.__stats()` (mode, particles, frames, viewport) and `window.__bandHist()`
(histogram of pigment bands) so a headless probe can assert on real runtime state.
A band histogram reading `[99,300,337,304]` means all pigments are present; `[832,208,0,0]`
means the palette mapping is broken. Verify interaction by hashing canvas pixels
before/after a pointer drag and after a click — a changed hash proves the interaction
actually reaches the simulation.

## Verification

Follow `html-artifacts`: pre-run the sim (200–400 steps) before the first visible frame,
screenshot with headless Chrome, inspect with vision. Paper mode needs its own pass —
it fails differently from night mode. Check narrow viewports for overlay collisions.
