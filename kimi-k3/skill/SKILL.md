---
name: html-artifacts
description: Use when creating HTML art/widgets for the chat surface.
version: 1.0.0
author: hermes-agent
license: MIT
metadata:
  hermes:
    tags: [html, generative-art, canvas, screenshot-verification, desktop-preview]
    related_skills: [dogfood, hermes-agent]
---

# HTML artifacts — generative art, widgets, mockups

## When to Use
- The user asks for something artistic, visual, or interactive delivered in chat — generative art, an animated canvas, a mini-widget, a mockup or poster.
- Any time you write a single-file `.html` artifact meant to be looked at and delivered via `::preview{}` or `MEDIA:` (syntax and theming rules are in the environment prompt; do not restate them).
- Also load this when asked to verify or iterate on an existing HTML visual artifact.

Build in the workspace, verify visually with headless Chrome, iterate, deliver.

## Craft rules

- Self-contained single `.html`: JS/CSS inline, no CDN or webfont fetches — the preview may be offline and external requests fail silently. System font stacks only (`Georgia, 'Times New Roman', serif` etc.).
- Generative canvases must pre-run their simulation (~100+ steps) before the first visible frame — otherwise the piece opens blank for the user AND every verification screenshot is empty.
- Honor `prefers-reduced-motion`: render a finished static composition instead of animating.
- Absolute-positioned overlay text and corner controls collide at exactly one viewport width: constrain overlay widths (e.g. `max-width: 62%`) and check them in the screenshot, never from CSS alone.
- `data-hermes-send` prompts must be fully self-contained — absolute path of the file to edit, exactly what to change, expected reply language — because the future turn arrives with no memory of this conversation.
- Repaint gradually on palette/state flips (temporary boosted fade-alpha over ~40 frames), never hard-fill, to avoid a jarring flash mid-trail.
- Reply in the user's language, warm and brief: the artifact is the message, prose is the caption.

## Verify before delivering — always

1. Load `scripts/screenshot-html.js` from this skill, write it to `/workspace/shot.js` (the skill dir is on the host; the script must run in docker), then `node /workspace/shot.js <artifact.html> --interact`.
   - It needs `puppeteer-core`: if missing, `cd /workspace && npm i puppeteer-core`. It discovers the cached Chrome under `/root/.cache/puppeteer/chrome/*` itself (override with `PUPPETEER_EXECUTABLE_PATH`).
2. The script logs page JS errors, waits for the piece to settle, writes `<base>-shot.png` (plus `<base>-shot-interact.png` after simulating pointer move + click), and lays the literal backslash-named copies that `vision_analyze` needs — a docker path like `/x/y.png` reaches vision mangled as `\x\y.png`, so copies must exist under `/`, `/root`, `/workspace`.
3. Inspect each PNG with `vision_analyze`: zero console errors, no layout collisions, the piece actually visible and well-lit, and the interaction screenshot must visibly differ from the calm one (if it doesn't, the interactivity you promised is broken).
4. Fix, re-shoot, re-inspect until clean. Deliver only then.

## Support files

- `scripts/screenshot-html.js` — headless-Chrome screenshot + interaction probe; handles Chrome discovery, error logging, settle wait, and the backslash-copy workaround.