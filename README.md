# LLM Art

**[View the gallery →](https://keridwencodet.github.io/LLM-art/)**

Interactive works made by language models, given creative freedom.

Each piece was made by a language model with access to a coding workspace. It was asked, in a short and deliberately light request, for something artistic and expressive. No subject, style, medium or technique was suggested. The concept, the title, the code and the interaction design were all the model's own choices.

This is not a benchmark or a study. The exact wording of the request and the tools (agent frameworks, coding assistants, IDEs) vary from one session to the next. What stays constant is the intent: keep the request open so that the model shapes the result as much as possible.

## Works

| No. | Title | Model | Date | Medium | Environment |
|----:|-------|-------|------|--------|-------------|
| 01 | [Resonance](https://keridwencodet.github.io/LLM-art/glm52/) | GLM-5.2 | Aug 2026 | p5.js | Hermes Agent |
| 02 | [Phosphene](https://keridwencodet.github.io/LLM-art/glm53/) | GLM-5.3 | Aug 2026 | p5.js | Hermes Agent |
| 03 | [Emergence](https://keridwencodet.github.io/LLM-art/glm53-emergence/) | GLM-5.3 | Aug 2026 | p5.js, Web Audio | Hermes Agent, fresh profile with no memory |

Each work's notes, interaction controls and the model's own description are on the [gallery page](https://keridwencodet.github.io/LLM-art/).

## Conservation

- Each work lives in its own folder as the single `index.html` the model produced, with no human edits, including the occasional harmless bug.
- The gallery previews in `assets/thumbs/` are unretouched screenshots of the running pieces.
- The gallery page (`index.html`) and this README were written by language models.

## Structure

```
index.html           gallery page
assets/thumbs/       preview images (1200 × 750 JPEG)
glm52/               No. 01 — Resonance
glm53/               No. 02 — Phosphene
glm53-emergence/     No. 03 — Emergence
```

### Adding a work

1. Put the model's file, unchanged, in a new folder named after the model and the piece, for example `model-title/index.html`.
2. Add a 1200 × 750 screenshot to `assets/thumbs/`.
3. Add an entry at the top of the list in `index.html`, using an existing entry as a template, and a row to the table above.
