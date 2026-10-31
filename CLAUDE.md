# Working on LLM Art

A museum-style gallery of works made by language models given creative
freedom, published with GitHub Pages from `main` (root, `.nojekyll`).
Site: https://keridwencodet.github.io/LLM-art/

The person who runs the collection is Keridwen Codet (Keri). She sends new
works (HTML files attached, images in a zip, sometimes logs and skills) with
the model's replies and the conditions, and we archive and present them.
She writes in French; the site is in English.

Read `README.md` first: it lists every work, the folder structure and the
steps for adding one. This file holds the conventions that are not obvious
from the code.

## Conservation

- The model's files are never edited. Fixes, framing and theme colours go in
  a presentation page written for the gallery (see `gemma4-31b/`,
  `mistrallarge4-latent/`, `nemotron3nano-ascii/`).
- When a model revised its work, keep both versions (`first-version.html`).
- When the model translated its own work, keep the translation beside it.
  Text works open on the original; instruments and interfaces open on the
  version the visitor can use, with the original linked (No. 17).
- Chat-only works are archived verbatim as `.md` files.
- Strip local paths and usernames (e.g. `C:\Users\...`) from anything archived.
- Only what the model made itself is shown. Material it fetched or copied
  (ASCII art from websites, cowsay, online banner services) is not kept; the
  cartel says what was left out and why (Lab 13).
- Check the model's claims against its code and its command traces before
  writing them down. Models misreport what they did.

## Gallery and Laboratory

- `index.html` is a selection; `lab/index.html` keeps series, re-runs and
  experiments. Keri decides what goes where; offer a recommendation, then ask.
- Both are newest first. Numbers are chronological: gallery `No. NN`,
  laboratory `Lab NN`.
- Entry template: copy an existing `li.work`. `data-family` places it in the
  gallery index; a new family also needs its lab in `LABS` in the index
  script (e.g. `"Nemotron": "NVIDIA"`), and a place in `ORDER`, the order
  of the families in that page's index, which Keri chooses.
- The cartel records conditions honestly: environment (Hermes Agent profile,
  skills present or not, SOUL.md lines, described rather than quoted), the
  person's interventions (bug reports, suggestions), duration when notable.
- Translations by us are credited "English translation: Claude Opus 5.5,
  for the gallery"; translations by the model are marked as its own.

## Notes page

`notes/index.html` (EN and FR, kept in sync) discusses recurring motifs:
flow fields from skill recipes, models writing when given no recipe or a
freer character, the "shared notebook" of skills that agents edit. Update
the work count in both ledes when adding a work (41 as of Lab 21). Skills
that models wrote are archived (`notes/hermes-p5js-skill.md`,
`minimax-m3-latent/skill/`, `kimi-k3/skill/`) and Keri removes them from her profile so they
don't contaminate later tests.

## Screenshots

Thumbnails are unretouched screenshots, 1200 × 750 JPEG in `assets/thumbs/`
and 400 × 250 in `assets/thumbs/small/`. Playwright and Chromium are
available in cloud sessions. cdnjs and Google Fonts may be blocked from the
container: serve p5.js and fonts from npm packages (`p5`, `@fontsource/*`)
through `page.route()`. Pages made for an agent's preview pane need the
theme variables the frame page supplies.

## Workflow

Develop on the session's branch, open a PR, and merge it once it's checked
(Keri has authorised merging). Pages deploys take a minute, sometimes
longer; "nothing changed" is usually the browser cache (Ctrl+Shift+R).
