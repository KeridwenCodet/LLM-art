# Corpus → latent space → poetry: the pipeline and its failure signatures

Reference for `latent-poetry-instrument`. Each stage below lists what to build,
the constants that matter, and the **failure signature** that tells you the
stage — not a later stage — is wrong.

## Pipeline order

```
corpus lines
  → tokenize per line
  → co-occurrence counts (sliding window, WINDOW=5)
  → PPMI matrix over words with freq ≥ 2
  → power iteration + deflation → D=8 eigenvectors
  → embeddings = rows of PPMI projected on those 8 axes, centred, unit-normalised
  → 2D projection (axes 0,1, z-scored, common scale)
  → k-means on the 2D points → K families + labels
  → fragment vectors = mean of member word embeddings, renormalised
  → fragment→fragment similarity matrix
  → at each step: score candidates (semantic + spatial + continuity + temp)
  → walk the fragments, emit their words verbatim, punctuate at junctions
```

Build fragments **before** clustering if family labels use the fragment-head
signal — the clusterer needs the fragment list that the labeller scores.

## Constants that mattered

| Constant | Value | Why |
|---|---|---|
| `WINDOW` | 5 | co-occurrence window; 5 captures "the cup on the table" but not a whole line |
| min word freq | 2 | freq-1 words have no reliable PPMI row; they pollute the field |
| `D` (latent dims) | 8 | fewer collapses the space, more adds noise axes |
| power iterations | 90 | below ~60 the eigenvectors have not converged; check by rerunning with more |
| temperature range | 0.08–2.4 | 0.08 ≈ always the argmax; 2.4 ≈ near-uniform |
| `condW` (spatial) | 5.4 | at 2.4 a click moved the target fragment only 1.4 %→3.3 %; at 5.4 it reached 1.4 %→6.7 % |
| `semW` | 3.4 | semantic pull toward the current fragment |
| `contW` | 0.9 | attested bigram continuity |
| `repeatPenalty` | 2.2 | discourages reusing a fragment within one verse |
| `tempNoise` | 0.55 | jitter before softmax; above ~0.8 the model loses its grip |

## Failure signatures by stage

| Symptom | Stage | Cause | Fix |
|---|---|---|---|
| Fluent but empty text ("choisit les bouche les yeux et pluie a des choses") | generation unit | word-level n-grams | switch to fragment units — do NOT add smoothing |
| Every other word is a dangling article | tokenization / corpus | fragments start with articles | strip leading articles from the corpus |
| A junction reads "the the" | corpus | two fragments both start with a determiner | keep a determiner set; reject a candidate whose first token collides with the previous fragment's last token |
| Verse never ends | stop gate | stop probability too low, or no stop signal at all | separate the stop decision from the word softmax; never let the stop token compete with words |
| Verse ends after one word | stop gate | stop probability too high early | require a minimum word count before stopping |
| Verses run to 27+ words | stop gate | no length prior | add a length prior that rises with word count |
| First word appears twice | fragment walk | the fragment's first token is pushed on entry AND as the continuation | push it exactly once on entry |
| Family label is a function word ("stays", "like") | labelling | label chosen by raw frequency | score by centrality + fragment-head bonus; frequency only breaks ties |
| Family label is "—" | labelling | every member is a stopword | fall back to the most frequent member regardless of stopword status |
| Clicking barely changes the panel | conditioning | `condW` too low, or the lens radius too wide | raise `condW`; tighten the Gaussian sigma; verify by comparing the target's probability before/after |
| Field looks like uniform noise | projection | the 2D axes carry no structure | inspect the top similarity pairs — they should be *meaningful* ("close~eyes", "comes~back"); if they are not, the PPMI matrix or the eigenvector iteration is wrong |
| Text renders as unreadable streaks in a screenshot | capture | JPEG on thin light-on-dark text | a codec artifact, not a render bug — disable the film-grain overlay or capture PNG, and verify alignment with the fillText tracer |

## Choosing the field brightness

Node brightness = aggregated probability of the candidate fragments containing
that word. This keeps the field **lexical** (every node is a real word you can
read) while making it **expressive** (the field visibly responds to the
model's state). A field of coloured dots with no words is unreadable; a field
of words with no response is inert.

## Panel content

The panel must show the **same distribution the generator samples from** —
candidate fragments with real probabilities and bars. Showing isolated
next-words instead makes the panel look like noise and severs the link between
what you read and what you get.

## Verifying the graph is semantically real

Do not settle for "the code ran". Inspect the highest-similarity word pairs:
they must be *meaningfully* related ("close~eyes", "comes~back", "breathes~
house"). If the top pairs are arbitrary, the latent space is decorative and
the whole premise of the piece collapses.
