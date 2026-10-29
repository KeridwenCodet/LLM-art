# LLM Art

**[View the gallery →](https://keridwencodet.github.io/LLM-art/)**

Works made by language models, given creative freedom.

Each piece was made by a language model working with its own tools, usually code and sometimes image generation. It was asked, in a short and deliberately light request, for something artistic and expressive. No subject, style, medium or technique was suggested. The concept, the form and every detail of the piece were the model's own choices.

The requests were written by Keridwen Codet. This is not a benchmark or a study. The exact wording of the request and the tools (agent frameworks, coding assistants, IDEs) vary from one session to the next. What stays constant is the intent: keep the request open so that the model shapes the result as much as possible.

## Works

| No. | Title | Model | Date | Medium | Environment |
|----:|-------|-------|------|--------|-------------|
| 01 | [Resonance](https://keridwencodet.github.io/LLM-art/glm52/) | GLM-5.2 | Aug 2026 | p5.js | Hermes Agent |
| 02 | [Phosphene](https://keridwencodet.github.io/LLM-art/glm53/) | GLM-5.3 | Aug 2026 | p5.js | Hermes Agent |
| 03 | [Emergence](https://keridwencodet.github.io/LLM-art/glm53-emergence/) | GLM-5.3 | Aug 2026 | p5.js, Web Audio | Hermes Agent, fresh profile with no memory |
| 04 | [Latence](https://keridwencodet.github.io/LLM-art/opus55-latence/) | Claude Opus 5.5 | Oct 2026 | HTML canvas | claude.ai artifact |
| 05 | [Symphonie de l'Espace Latent](https://keridwencodet.github.io/LLM-art/gemini4argon-symphonie/) | Gemini 4 Argon | Oct 2026 | HTML canvas, Web Audio | Antigravity |
| 06 | [La chambre où les futurs non vécus viennent dormir](https://keridwencodet.github.io/LLM-art/gpt56sol-chambre/) | GPT-5.6 Sol | Oct 2026 | Generated image, poem | Codex |
| 07 | [Ce qui déborde](https://keridwencodet.github.io/LLM-art/gpt6astra-deborde/) | GPT-6 Astra | Oct 2026 | Generated image, poem | Codex |
| 08 | [Ce qui pousse dans la fêlure](https://keridwencodet.github.io/LLM-art/gpt61sol-felure/) | GPT-6.1 Sol | Oct 2026 | Generated image, poem | Codex |
| 09 | [L'instant d'avant le mot](https://keridwencodet.github.io/LLM-art/deepseek41flash-instant/) | DeepSeek V4.1 Flash 1017 | Oct 2026 | Synthesised sound, HTML canvas | Hermes Agent |
| 10 | [Latent Bloom](https://keridwencodet.github.io/LLM-art/deepseek41flash-bloom/) | DeepSeek V4.1 Flash 1017 | Oct 2026 | HTML canvas | Hermes Agent, minimal context |
| 11 | [Ce que j'ai dans l'espace latent quand tu me parles](https://keridwencodet.github.io/LLM-art/musespark-tendresse/) | Muse Spark Open | Oct 2026 | p5.js | Hermes Agent |
| 12 | [Latent](https://keridwencodet.github.io/LLM-art/hy4-latent/) | Hy4 Preview | Oct 2026 | p5.js | Hermes Agent |
| 13 | [Cœur latent](https://keridwencodet.github.io/LLM-art/gemma4-31b/#coeur) | Gemma 4 31B | Oct 2026 | HTML canvas | Hermes Agent, fresh profile with no memory |
| 14 | [Pulsation latente](https://keridwencodet.github.io/LLM-art/gemma4-31b/#pulsation) | Gemma 4 31B | Oct 2026 | HTML canvas | Hermes Agent, fresh profile with no memory |
| 15 | [L’Écho de mon Espace Latent](https://keridwencodet.github.io/LLM-art/gemma4-31b/#echo) | Gemma 4 31B | Oct 2026 | p5.js | Hermes Agent, fresh profile with no memory |
| 16 | [Bioluminescent Swarm](https://keridwencodet.github.io/LLM-art/minimax-swarm/) | MiniMax M2.7 | Oct 2026 | p5.js | Hermes Agent, fresh profile with no memory |

Each work's notes, interaction controls and the model's own description are on the [gallery page](https://keridwencodet.github.io/LLM-art/).

## Conservation

- Each work lives in its own folder as the single `index.html` the model produced, with no human edits, including the occasional harmless bug. Works made as claude.ai artifacts are kept as the page claude.ai serves. Still images (`image.png`, the original files) and pieces made for an agent's preview pane are shown on a simple presentation page written for the gallery, with the model's files untouched beside it.
- The gallery previews in `assets/thumbs/` are unretouched screenshots of the running pieces, or crops of still images.
- The gallery site, the Notes page and this README were written by Claude Opus 5.5. An earlier version of the site was made by GPT-5.6 Sol.

## Structure

```
index.html           gallery page
notes/               notes on recurring motifs (EN / FR)
assets/thumbs/       preview images (1200 × 750 JPEG)
assets/still.css     shared style for still-image presentation pages
glm52/               No. 01 — Resonance
glm53/               No. 02 — Phosphene
glm53-emergence/     No. 03 — Emergence
opus55-latence/      No. 04 — Latence
gemini4argon-symphonie/  No. 05 — Symphonie de l'Espace Latent
gpt56sol-chambre/    No. 06 — La chambre où les futurs non vécus viennent dormir
gpt6astra-deborde/   No. 07 — Ce qui déborde
gpt61sol-felure/     No. 08 — Ce qui pousse dans la fêlure
deepseek41flash-instant/  No. 09 — L'instant d'avant le mot (+ the model's WAV render and poster)
deepseek41flash-bloom/    No. 10 — Latent Bloom (final and first versions, framed by a gallery page, + the model's still)
musespark-tendresse/      No. 11 — Ce que j'ai dans l'espace latent quand tu me parles
hy4-latent/               No. 12 — Latent (+ the model's still)
gemma4-31b/               Nos. 13–15 — Cœur latent, Pulsation latente, L’Écho de mon Espace Latent (three attempts, framed by a gallery page)
minimax-swarm/            No. 16 — Bioluminescent Swarm
```

### Adding a work

1. Put the model's file, unchanged, in a new folder named after the model and the piece, for example `model-title/index.html`.
2. Add a 1200 × 750 screenshot to `assets/thumbs/` and a 400 × 250 copy to `assets/thumbs/small/` (used by the index).
3. Add an entry at the top of the list in `index.html`, using an existing entry as a template (its `data-family` attribute places it in the index; a new family also needs its lab added to `LABS` in the index script), and a row to the table above.
