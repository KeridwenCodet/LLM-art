---
name: creative-coding
description: Use when creating digital art. Build and verify it.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [generative-art, canvas, animation, visual-verification]
    related_skills: []
---

# Creative coding

## When to Use

Use for interactive, generative, animated, or procedural digital artifacts, including Canvas/SVG scenes and visual poetry. Do not use for ordinary static copy or unrelated web applications.

Create the actual artwork, not a proposal for one. When the user gives creative freedom, choose a strong concept immediately and build; reserve questions for genuine constraints.

## Procedure

1. **Set the artistic brief.** Choose a title, emotional arc, restrained palette, visual motif, and motion language. Give the piece one clear focal gesture rather than several competing effects. Match the user's language and keep the framing short so the artifact remains central.
2. **Build a self-contained artifact.** Prefer HTML/CSS/JavaScript with Canvas or SVG for interactive pieces and no external assets unless they add something essential. Include responsive sizing, capped device-pixel ratio, delta-time capping, pause/visibility handling, keyboard-accessible controls, and reduced-motion behavior. Never autoplay audio.
3. **Make the first frame composed.** Do not rely solely on particles or trails accumulating for a long time; establish the main form immediately, then let motion enrich it. Keep text and functional controls legible at the actual display size.
4. **Exercise it in a real browser.** Check console and page errors, canvas/SVG dimensions, overflow, pointer interaction, pause/resume, and any timed transitions. Test a narrow viewport when the layout claims to be responsive.
5. **Inspect visual evidence.** Capture the initial state and a developed state, then inspect the images rather than inferring beauty from code. Adjust composition, contrast, and motion from what is visible. If execution and rendering disagree, follow [the canvas verification recipe](references/canvas-verification.md).
6. **Verify after the final edit.** A successful earlier capture does not validate the current artifact. Confirm the final visual state and interactions before delivery.
7. **Deliver the work.** Use the desktop HTML preview directive for an interactive piece and optionally provide a captured still as a downloadable image. Introduce it with a title and minimal usage guidance, not a technical build log.

## Canvas and animation rules

- Make resize handlers idempotent: compare CSS size, device-pixel ratio, and backing-store dimensions before clearing or reseeding. Screenshot and preview operations may emit resize events without a real size change, and unconditional canvas resets erase accumulated artwork.
- Preserve the current bitmap across a genuine resize when practical; otherwise immediately render a representative frame, especially while paused.
- Separate simulation state from rendering so pausing freezes the piece without destroying it.
- Keep overlays, blend modes, and vignettes subordinate to the artwork. If the raw canvas is expressive but the page is not, inspect compositing before increasing brightness.
- Treat visual subtlety as a deliberate choice, not a substitute for a visible focal structure.
