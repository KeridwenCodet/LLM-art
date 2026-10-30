---
name: latent-poetry-instrument
description: Use when building a self-contained generative poetry piece.
version: 1.0.0
author: Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [generative-art, poetry, canvas, latent-space, single-file-html]
    related_skills: [claude-design, p5js, ascii-art]
---

# Generative poetry instrument (single-file HTML)

## When to Use

Trigger this skill when the user asks for an **artistic** browser piece that
exposes a language model's internal state — latent space, word embeddings,
next-token distribution, PPMI/semantic fields — especially when the deliverable
must be a **single self-contained HTML file** with no network dependency.
Also use it for the failure mode "my n-gram model produces fluent but
meaningless text" and for "make the probabilistic panel show something a human
can actually read".

A reusable workflow for "a browser artwork that materializes a language model's
latent space" — the kind of request where the user wants something *artistic and
expressive*, not a technical demo.

## Working with this user

- **Open-ended artistic briefs mean deliver, don't interview.** When the brief
  is "whatever you want" / "carte blanche", the artwork itself IS the answer.
  Ship a finished, verified piece. Do not spend the turn asking what concept
  they'd prefer — pick one, own it, and present it with its mechanism
  explained.
- **Aesthetic ambition outranks technical minimalism.** They asked for
  something "very expressive". Ship a piece with real depth — a semantic
  field, a live distribution, a generative verse — not a minimal demo that
  proves the technique and stops.
- **A language switch must be TOTAL.** When they grant a language change for
  the text ("you can put all the texts in English"), it covers every visible
  surface at once: corpus, UI labels, panel headers, generated verse, and any
  in-piece documentation. A half-translated piece reads as unfinished.
  Regenerate the artifacts and re-run the whole verification suite after the
  switch — tokenizers, stopword lists, and linters are all language-bound.
- **Explain the mechanism, briefly, in the delivery.** They want to see what
  is inside the latent space, so name the real pipeline (PPMI → latent dims →
  distribution → conditioning) and give the measured numbers (before/after
  probability on a click, entropy, fragment count). Numbers prove it is a
  real model rather than a decorative animation.
- **Report the artifact's real location.** State where the file is on their
  drive and what is inside the folder. Confirm the final artifact runs from
  the delivered path, not only from the build directory.

## Architecture that actually works

**Use the corpus FRAGMENT as the generating unit, not the word.**
Word-level n-gram generation (bigram/trigram + EOS + affinity) produces
grammatically valid but *semantically incoherent* output — recycled isolated
words, dangling articles. The fix is structural, not probabilistic:

1. Every corpus line becomes a node in the latent space.
2. Its vector = mean of its word embeddings, renormalized.
3. Generation walks fragment→fragment; words inside a fragment are emitted
   verbatim in order, so the grammar is preserved by construction.
4. The next fragment is chosen by cosine proximity in latent space + spatial
   conditioning + temperature.

This yields fluent poetry. Do not attempt to fix word-level generation with
more smoothing — switch units.

## Corpus curation

The corpus IS the model's world — its quality caps the artwork's quality.

- **One idea per fragment.** A fragment carrying two images ("the cup breaks,
  and the room goes dark") reads as two fragments glued together and produces
  muddled joints. Split them.
- **Fragments must be spliceable in any order.** Strip anything that only
  makes sense in one position (leading articles, trailing pronouns that
  reference a subject, leading conjunctions). Then ANY fragment can follow
  ANY fragment and still be grammatical.
- **No terminal punctuation.** The generator inserts the comma at a junction
  and the period at the end; a period already in the corpus yields "…door. The
  kettle…".
- **Dedupe the SOURCE file, not just the build output.** A dedupe at
  injection time hides the problem from your own checker and skews frequency
  counts, which feed PPMI and therefore the geometry.
- **Keep 2–11 words.** One-word fragments are too thin to carry a vector;
  beyond ~11 they overflow the verse line and force ragged wrapping.
- **Keep the corpus monolingual.** Mixed-language corpora break the tokenizer
  and poison the stopword list.

### Re-tuning the linter when the corpus language changes

A corpus linter carries a stopword list and a "foreign word" list. Both are
language-specific and both fail silently after a language switch:

- Shared short words become false positives ("a" is English *and* was in the
  French stoplist). Audit the foreign-word list by hand after every switch.
- Re-tune the length bounds to the new corpus, not to the old one's habits.

## Labeling the families

Cluster labels appear in the panel and are the only words naming the regions
of the field. Frequency alone produces function words ("stays", "like"),
because they co-occur with everything. Rank candidates by:

1. **Semantic centrality** — mean similarity to the other members of the
   cluster: the word that best *means* the cluster.
2. **Fragment-head bonus** — words that open fragments are content words
   ("kettle", "window"); function words rarely head a phrase. Weight this
   enough to break near-ties.
3. **Frequency** — last, as a tiebreaker only.

This makes the label a name rather than a noise word, and it is what makes the
panel legible as a taxonomy instead of a wordlist.

**Build order matters:** build fragments BEFORE clustering, because the
head-bonus signal comes from the fragment list. If labels come out as
function words, check this ordering before tuning the weights.

## Rendering

- **Field**: draw vocabulary words as nodes; brightness derives from the
  probability of the candidate fragments that contain them. Node = word
  (readable), brightness = model state (expressive). Keeps the field lexical.

## Temporal smoothing (halos must never jump)

**Render from a smoothed state, never from the raw probability array.**
Reading `lastProb` directly in the draw function makes every halo snap to
its new radius/alpha the instant the distribution is recomputed — the user
reads that as flickering. Keep a persistent per-node `{a, r}` map and
converge it toward the current target every frame.

Four rules, all load-bearing:

1. **Exponential convergence**, `k = 1 - Math.exp(-dt/220)`. Frame-rate
   independent (use the real `dt`, not a fixed constant).
2. **New halos start at zero**, `{a:0, r:16}` — never at a fraction of their
   target. A halo that appears at 25% of its brightness is a visible pop.
3. **Death shrinks as well as fades.** On removal, drive `a → 0` AND `r → 16`
   (the base radius), then delete. Letting alpha fade while the radius stays
   huge leaves a shrinking bright disc that reads as a flash.
4. **Cap the per-frame step.** Exponential smoothing still jumps on a frame
   hitch: `dt` is clamped (e.g. 50ms), so `k` becomes large and one frame
   can move the halo far. Clamp the delta to a max (e.g. `MAX_A=0.018`,
   `MAX_R=3.2`). This is the difference between "smooth" and "smooth except
   when the tab hiccups".

**Smooth per *fragment*, not per word.** If several fragments share a head
word, merging them into one halo changes the additive brightness (halos stack
with `globalCompositeOperation='lighter'`). Smooth each fragment's halo
independently and draw them all — that preserves the exact light output.

**The dominant-word marker needs the same treatment.** A ring that teleports
from one word to the next is the same artifact as a jumping halo. Cross-fade
it: keep the outgoing word alive at decaying alpha while the incoming one
fades in, and cap that fade's step too.

### The aliasing trap: ms clock in a sine wave

**A millisecond clock in a trigonometric function aliases into noise.**

Canvas apps usually keep `S.time` in milliseconds (for lifetimes, delays,
`age = t - born`). But `Math.sin(t * 1.6)` with `t` in ms means 1.6
radians *per millisecond* — 4.2 cycles per 60fps frame. The sampled phase
lands essentially at random, so the radius teleports between its extremes
every frame: a ring visibly alternates between small and large, and any text
positioned relative to it (e.g. `y = node.y - radius - 9`) jumps too.

The tell: a value that *should* be smooth is fine at 30fps and broken at
60fps, and the "smooth" output jumps by the full amplitude of the sine.

Fix: keep a **separate seconds clock** for oscillation, and pass it
explicitly to the functions that need it. Do not convert at the call site
(`drawX(S.ts)`), and do not reuse `S.time`:

```js
// state
time: 0,   // ms : durees de vie, delais
ts:   0,   // s  : oscillations
// frame
S.time += dt;      // dt en ms
S.ts   += dt/1000;
```

Functions that need both take both: `drawVerse(S.time, S.ts)` — word age in
ms, cursor blink in seconds.

**Audit every `Math.sin`/`Math.cos` for its time unit.** The frequency
constant tells you the intended unit: `sin(t*0.22)` for a ~29s breathing
period is a *seconds* clock; `sin(t*3)` for a cursor is also seconds.

### Proving a fix: build the broken version on purpose

To claim a fix works you need a baseline that differs **only** by the bug.
Copy the current template, revert just the one line, rebuild with the same
fonts, and diff the two. Then the measured difference is attributable to
that line alone — not to other changes made along the way.

A stale "old build" from weeks ago confounds the comparison: it differs in
dozens of ways, so a metric improvement cannot be attributed.

### Measuring the marker: slope, not frame-to-frame diff

Comparing consecutive frames is fragile: the marker sometimes draws nothing
for a frame (fully faded), so two consecutive *samples* can be far apart in
time, and you measure a jump that never happened on screen.

Measure the **slope** instead — `|Δradius| / Δt` in px/s — and normalize by
the artwork's own clock. The theoretical slope of `26+15*sin(ts*1.6)` is
`15*1.6 = 24 px/s`. A broken (ms) version measures ~1360 px/s; a fixed one
measures exactly 24.00. That number is deterministic run after run, so it is
a far better regression signal than a raw frame diff.

Wall-clock slope (`performance.now()`) is noisy — draw time varies per
frame — so prefer the artwork's clock, and report wall-clock only as an
indicative extra.

### Measuring it (two independent ways)

Measure BOTH the internal state and the rendered pixels — they catch
different failures:

- **Internal**: sample `a` and `r` per halo every frame; report max
  per-frame delta. Target: alpha delta well under ~0.02.
- **Pixels**: composite the canvas onto the real background colour, then
  diff consecutive frames. Report max diff and max/mean ratio — the ratio
  is what reveals "one frame in twenty goes wild".

**Compositing trap:** the scene canvas is transparent, so `getImageData` on
it returns *unpremultiplied* RGB — bright values with alpha ~13. If you
`drawImage` that into a scratch canvas without first filling the background,
your "brightness" numbers are meaningless. Always
`fillRect` the background colour onto the scratch canvas, then draw.

**Also measure brightness over many frames, not one.** Instantaneous
luminance depends on the current distribution; a single frame is not
representative and swings by ±10%. Sample ~30 frames and compare means.

**Build a reference build to compare against.** Keep the pre-fix HTML
alongside the new one and diff them. Without a baseline you cannot claim an
improvement, only that the new value looks small.

### Pitfall: "fixing" flicker by deduplicating

Merging halos that share a word into a single merged halo looks like the
right cleanup and silently dims the field ~19%, because the original stacked
them additively. If a fix changes brightness, the fix changed the artwork —
verify luminance against the baseline and restore the stacking.
- **Panel**: show the *actual candidate fragments with their real
  probabilities* and bars — the same distribution the generator samples from.
  A panel of isolated next-words looks like noise; a panel of sentences shows
  the model thinking.
- **Verse**: Cormorant Garamond for poetry, IBM Plex Mono for UI.

## Punctuation & capitalization

Handle at the *display* layer via a `displayOf(word, isFirst)` helper:
- first word of a phrase → capitalize
- standalone `i` → `I`
- fragment junction → comma on the previous word; end of phrase → period

**Diagnostic output must use the display helper**, not raw tokens. Reading raw
tokens makes correct output look broken (lowercase `i`, missing commas) and
sends you chasing a bug that does not exist.

## Non-negotiable correctness checks

Test the *displayed* string. Build a `window.__stats()` hook returning
geometry + displayed text, and assert on it.

## Self-containment

- Download fonts, subset to latin, convert to WOFF2, inline as base64
  `data:font/woff2` — 5–7 `@font-face` blocks.
- Audit the final file: zero external URLs, zero `@import`, zero external
  `<script src>`. Then **prove** it: run a Playwright context with
  `offline: true` and a route handler that aborts every non-`file://`
  request. Assert zero blocked requests needed AND zero JS errors AND
  `document.fonts.check()` true for both families.

## Verification suite (headless Playwright)

Ship with these, all runnable against the built HTML:
- `verify.js` — no JS errors, model produces lines
- `verify-layout.js` — 4 viewports, no overflow, field/panel never overlap
- `verify-offline.js` — works with network cut, fonts load
- `verify-cond.js` — clicking a word measurably raises its fragment's
  probability (compare before/after)
- `verify-temp.js` — samples at 4 temperatures, prints generated lines
- `trace.js` — instruments `CanvasRenderingContext2D.prototype.fillText` to
  log every drawn string + position. Use this to check panel alignment and
  prove nothing overflows the frame, without squinting at a thumbnail.

Portable versions of the reusable probes ship with this skill under
`scripts/` — copy them into the project and run them against the built HTML:
`scripts/verify-offline.js`, `scripts/trace-canvas-text.js`,
`scripts/inspect-graph.js`, `scripts/check-corpus.py`. Each resolves
playwright-core from several candidate locations, so no path is hardcoded.

## Visual inspection via base64 (and its traps)

`vision_analyze` rejects local paths ("Only base64 data is allowed") — pass a
`data:image/jpeg;base64,...` URL.

**Long base64 strings get mangled in transit.** Symptoms:
`Incorrect padding`, `Excess data after padding`, `broken data stream`.
Mitigations, in order of preference:
1. Keep the image small enough to paste in ONE piece (< ~2200 base64 chars works).
2. If too big, split and verify the joined string equals the source before
   pasting (`assert A+B == original`) — then paste A and B **with no space
   between them**. A single inserted space causes "Only base64 data is allowed".
3. Verify the decode before sending: `base64.b64decode(s, validate=True)`.

**JPEG destroys thin light-on-dark text.** A crop of small mono text on a dark
panel comes back as unreadable streaks — that is a codec artifact, not a
rendering bug. Fix by disabling the film-grain overlay before capture
(`window.drawGrain = function(){}` — only works if the function is a global
property, so it must not be inside a module closure) and/or capturing PNG.
Diagnose rendering correctness with `trace.js` instead of a JPEG crop.

## Responsive layout

Below ~1000px the right-hand instrument panel cannot fit: switch it to a
horizontal banner under the title and push the field down. Recompute field
height as `S.H - fieldY - 250` (250 reserved for the verse). Test 1440, 1100,
820, and 1920 wide.

## Delivery

- **Put the deliverable in a named folder, never at the drive root.** If the
  workspace maps to the user's drive, a build pipeline scatters `src/`,
  `node_modules/`, `shots/` and fonts across `C:\`. Create one folder for the
  project and put the artifact inside it.
- **Deliver the artifact path, not a build directory.** The user opens one
  HTML file; keep sources and tests beside it, not required by it.
- **Re-verify from the final location.** Copying or moving a project breaks
  every hardcoded absolute path in its scripts and build steps (node
  `require('/workspace/...')`, font directories, corpus paths). After any
  move, search the tree for the old absolute path, rewrite it, and re-run the
  full suite FROM the new location — a suite that passes only in the original
  directory proves nothing about the delivered artifact.

## Pitfalls

- **Relocating breaks hardcoded paths.** See Delivery. The failure is silent
  in the artifact and loud in the scripts; check both places.
- **Recursive deletes of paths containing a drive spec can trip command
  guards.** A quoted `C:` segment inside a recursive delete reads as a
  filesystem target. Remove such directories with explicit shallow deletions
  instead.
- **Diagnostic output that strips punctuation invents bugs.** The display
  layer owns capitalization and commas; a raw-token dump makes correct output
  look broken. See Punctuation & capitalization.
- **JPEG artifacts masquerade as rendering bugs.** See Visual inspection.

## References

- `references/corpus-model-recipes.md` — the corpus → PPMI → latent space →
  distribution → generation pipeline in detail, with the tuning constants and
  the failure signature that identifies each stage as miscalibrated.

## Environment notes

- In Hermes desktop the terminal is a Docker sandbox; `/workspace` may be a
  9p mount of the host's `C:\`. Check `mount | grep 9p` before assuming a path
  maps to the user's machine — it changes where the deliverable must land.
- `browser_exec` may fail on a missing `fcntl` module. Use
  `playwright-core` + the system Chromium directly instead:
  `executablePath: '/opt/playwright/chromium-*/chrome-linux64/chrome'`,
  args `--no-sandbox --disable-dev-shm-usage --use-gl=swiftshader
  --enable-unsafe-swiftshader`.
