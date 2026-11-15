# Solution job: `<BOOK>` Vol `<V>` Ch `<CH>` `<SECTION>` Q`<N>`

Read `lib/solutions/kits/AUTHORING.md` (or `AUTHORING.md` in the OSS repo) and run `npm run solutions:new -- --list` first. Write **one** declarative solution data file, regenerate registries, and verify all static gates.

## Target file
- Main repo: `lib/solutions/books/<book>/solutions/ch-<CH>/<section>-<N>.ts`
- OSS repo (`scifunlab-solutions`): `books/<book>/solutions/ch-<CH>/<section>-<N>.ts`

You can scaffold the starting file with:

```bash
npm run solutions:new -- \
  --book <book> --chapter <CH> --section <section> --number <N> \
  --kit <kit-id> --title "<Short Original Title>" \
  --name "<Author Name>" --github "<github-handle>"
```

## Question specification
- **Citation**: `book: "<book>"`, `volume: <V>`, `chapter: <CH>`, `section: "<section>"`, `number: <N>`.
- **Given values (only values come from textbook)**: `<e.g. u = 10 m/s, alpha = 0 deg, g = 9.8 m/s^2>`
- **Textbook numerical answer**: `<value and unit>`
- **Kit to reuse**: `<kit id>` (verify compatibility against `model.ts`: `objects`, `outputs`, `guesses`, `tunables`, `focuses`).
- **Guess**: `<guess name>` with tolerance `<t>` (or `"none"` if conceptual-only).
- **What if**: tune `<tunable>`; challenge `<none | max/min of output | target value +/- tol>`, `label`, and formula-verified `why`.

## Authoring requirements
- **100% original phrasing**: setup sentence (`inShort`), step titles, `board` lines, scene links `describe`, and `whatIf.challenge.why` must be written freshly in your own words. Never copy problem text or artwork verbatim.
- **Strict SDK import**: import ONLY from `"@scifunlab/solution-sdk"` (`export default defineSolution(...)`).
- **Chalkboard budget**: 3–6 steps, 1–4 `board` lines per step, `<= 38` rendered characters per line, computed values pulled from `{key}` placeholders, subtracted intermediates at `{key:3}`, final answer line boxed (`((... |box))`) with `!tick`.
- **Attribution**: include your `credits` entry (`name`, optional valid `github` handle, `role: "author"`).

## Verification gates (must be clean)

```bash
npm run solutions:generate
npm run solutions:check
npm run typecheck
npm run lint
```

In a full browser session (recommended before finalizing PRs), also run `npm run build` and check the rendered route on desktop (`1280x900`), mobile (`390x844`), and `?nowebgl` poster fallback.

## Report
- File path created/updated and regenerated registry status
- Gate outputs (`solutions:check`, `typecheck`, `lint`, plus `build` / browser checks if run)
- Computed model answer side-by-side with textbook answer and hand derivation
