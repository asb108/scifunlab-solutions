---
name: scifunlab-solution-lab
description: Build SciFunLab's interactive 2D and 3D textbook solutions ("solution labs") for HC Verma and other textbooks — an interactive lab bench the student plays with (guess by acting, release, see the motion), a chalkboard that writes each step, and What-if controls — then verify, score and repair it over several rounds until it meets the quality bar. Use whenever the user asks to create, add, write, animate, fix, polish or improve a solution, a solved question, a 2D/3D/interactive/animated solution, a lab bench or a solution kit for SciFunLab, or to hand that work to other agents.
---

# SciFunLab solution labs

Every SciFunLab book solution is a small interactive lab, not a static article or wall of text. Your job is not only to build one, but to make it **the best version you can**: build it, check it like a strict reviewer, repair what falls short, and repeat until every check passes and nothing obvious is left to improve.

This skill is a method, not a rigid script. Adapt to whether you are working in the **main SciFunLab repo** (`lib/solutions/books/...`, `lib/solutions/kits/...`) or in the **open-source companion repo** (`asb108/scifunlab-solutions`, where paths live under `books/...`, `kits/...`, and `engine/`). Keep the fixed rules in section 2 intact everywhere.

Files that go with this skill:

- `references/quality-rubric.md`: the 12-point score you grade each round with.
- `references/repair-playbook.md`: symptoms seen in real benches, their causes and fixes.
- `lib/solutions/kits/AUTHORING.md` (or `AUTHORING.md` at the root of the OSS repo): the canonical data contract, board markup rules, shared SDK imports, and gates. **Read it in full before writing code.** If this skill and `AUTHORING.md` disagree, `AUTHORING.md` wins.

## 1. Orient (5 minutes, before anything else)

1. **Identify your workspace.** Run `git status` and `git branch --show-current`.
   - In the main repo, `lib/solutions/` holds `books/`, `kits/`, `bench/`, and `sdk/`; NEVER work directly on `main` or `codex/netlify-restore-20261018`.
   - In the open-source `scifunlab-solutions` repo, `books/` and `kits/` live at the repository root and `engine/` is the upstream mirror (never edit `engine/` or `app/` in solution/kit PRs).
2. **Discover what already exists with one command:**
   ```bash
   npm run solutions:new -- --list
   ```
   This prints every registered book, chapter number, valid `section` ID, and every reusable kit's `objects`, `outputs`, `guesses`, `tunables`, and `focuses`.
3. **Read the author guide and worked examples:**
   - Read `AUTHORING.md` (`lib/solutions/kits/AUTHORING.md` in main repo).
   - Inspect a complete kit (`projectile`, `blocks`, or `field`) and sample solution (`hc-verma/solutions/samples/projectile-on-slope.ts`).
4. **Work the physics out by hand before touching code.** Write down every given value, equation, intermediate number, final answer, and the textbook's printed answer. If your hand calculation disagrees with the book answer, resolve why (`g = 9.8` vs `10`, rounding, angle convention, or a misread figure) before building anything on top of it.

## 2. Fixed rules (never trade these away)

1. **Original textbook expression.** Cite `book`, `volume`, `chapter`, `section`, and `number`. Only the numerical given values and the numerical target answer come from the book. Every problem summary (`inShort`), step `title`, `board` line, visual description (`describe`), and `challenge.why` MUST be written in 100% original words. Never copy problem wording or figures verbatim.
2. **SDK boundary & ESLint sandbox.**
   - Contributed solution files (`**/books/**/solutions/**/*.ts`) may ONLY import `"@scifunlab/solution-sdk"` and export a `default` object built with `defineSolution(...)`. Zero React, `process`, `fetch`, `window`, `eval`, or local helper imports.
   - Kit `model.ts` files may only import `"@scifunlab/solution-sdk/kit"` (or pure `./` helpers in the same kit folder) — never `three` or React.
   - Kit `Poster.tsx` / `Bench.tsx` files (both 2D SVG/Canvas/Motion and 3D React Three Fiber) may import `@scifunlab/solution-sdk/kit`, `@scifunlab/solution-sdk/bench`, `react`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, and local `./` modules.
3. **The lab loop.** **Guess** (act before reading) → **Solve** (step-by-step chalkboard + highlighted instrument/diagram + SVG poster fallback) → **What if** (one interactive tunable parameter + live readout).
4. **Visual language & color discipline.** Keep the bright, high-contrast comic paper & ink aesthetic and the `tone` palette; vector colors are fixed (`velocity`: `#5B50FF`, `force`: `#FF5050`, `acceleration`: `#4ADE80`, `field`: `#FFDE59`).
5. **Works for everyone.** Keyboard and screen-reader control for every interactive handle, a 2D SVG `Poster.tsx` when WebGL is disabled (`?nowebgl`), reduced-motion support, and touch-friendly page scrolling on mobile (`touch-action: pan-y` on canvases).
6. **Attribution via `credits`.** Every contributed solution or kit should carry a `credits` entry:
   ```ts
   credits: [{ name: "Your Name", github: "your-handle", role: "author" }]
   ```
   (Validated GitHub handles are rendered on the published page.)
7. **Safety & budgets.** Never touch `infrastructure/`, `.env*`, `.claude/`, `.agents/`, `postiz-instance`, or deploy/Push/merge unless explicitly authorized. Keep first-load JS free of `three` / WebGL by keeping `Bench.tsx` strictly behind the lazy dynamic registry.

## 3. Decide the job and plan it

| The question… | Job | What you edit |
|---|---|---|
| fits an existing kit (same physical apparatus & observables) | **Solution job** | One `.ts` solution file under `<book>/solutions/` + regenerate registries |
| needs a new 2D/3D interactive apparatus | **Kit job** | `kits/<kit-id>/{model.ts, Poster.tsx, Bench.tsx}` + sample solution + regenerate registries |

Prefer reusing an existing kit when the apparatus genuinely matches the question. Never distort physics or visuals just to force a question onto the wrong apparatus.

Before coding, sketch a quick plan in your notes:
- **The teaching moment**: one sentence explaining what surprises or clicks when the student plays with the motion.
- **Guess**: what the student adjusts directly on the bench and its fair tolerance.
- **Steps**: 3–6 steps; each with `cue.at`, `cue.focus`, `cue.highlight` / `cue.show`, `cue.mark`, and 1–4 short `board` lines (`<= 38` rendered characters per line).
- **What if**: one meaningful tunable from the kit and (when helpful) a `challenge` whose target lies strictly inside `[min, max]` for `max`/`min` goals.
- **Hand numbers**: every intermediate and final value rounded cleanly (use `{value:3}` for subtracted intermediate terms so board arithmetic adds up cleanly).

## 4. Scaffold and build

Scaffold a new solution file cleanly instead of copying boilerplate by hand:

```bash
npm run solutions:new -- \
  --book hc-verma --chapter 3 --section exercise --number 45 \
  --kit projectile --title "Bank throw into a river boat" \
  --name "Your Name" --github your-handle
```

This creates the file with valid SDK imports and citations and refreshes the auto-generated registries (`models.ts`, `benches.ts`, `posters.tsx`, `catalog.ts`, `solutions.ts`, `<book>/solutions/index.ts`). Whenever you add, rename, or remove solution or kit files manually, re-run:

```bash
npm run solutions:generate
```

Both **2D kits** (layered SVG, Canvas, or Framer Motion views built with SDK helpers alongside `Poster.tsx`) and **3D kits** (React Three Fiber benches built from `@scifunlab/solution-sdk/bench` primitives: `BenchCanvas`, `Box`, `Cyl`, `Ball`, `PathHandle`, `DialHandle`, `PressButton`, `Guide`, `Ghosts`, `DashedPath`, `ValueTag`, `PartLabels`) follow the same `KitDefinition` + `BenchProps` contract:
- Call `store.landed(firedAt)` once when motion ends.
- Call `useKeepDrawing(true)` only while animating.
- Derive every rendered number on the chalkboard from `{key}` model output placeholders.

## 5. The improvement loop: verify → score → repair → repeat

Do not stop at "it compiles". Run **at least two review/repair rounds** until every applicable item in `references/quality-rubric.md` meets target.

### 5a. Static & data gates (both repos)

```bash
npm run solutions:generate
npm run solutions:check
npm run typecheck
npm run lint
```

Check physics and chalkboard lines carefully:
- Compare every model output (`outputs`) against your hand derivation and the book answer.
- Render/inspect every chalkboard line with substituted numbers: `<= 38` characters, subtracted intermediate terms formatted to 3 decimals, final answer line boxed (`((... |box))`) and suffixed with `!tick`.

### 5b. Production build & live browser check

```bash
npm run build
```

Then start a local production server on a dedicated port (for example `PORT=3120`) and inspect the live page in a headless browser at both **desktop (`1280×900`)** and **mobile (`390×844`)**, plus **`?nowebgl`** poster mode and reduced motion:
- **Guess tab**: drag/nudge handle away from start, press release/launch, confirm flight animation, stars/score banner, and zero console/page errors.
- **Solve tab**: click every step button (`Step 1` .. `Step N`), confirm camera focus / highlight updates, chalk lines reveal smoothly, and board marks align.
- **What if tab**: turn/nudge tunable control, confirm live readout & challenge completion when solved.
- **Mobile & accessibility**: verify `?nowebgl` completes Guess, labels do not clip or overlap, `scrollWidth <= innerWidth`, and swiping vertically over the bench scrolls cleanly.

In the **main `scifunlab` repo**, also run the full Task 5 performance, SSR, and regression gates:

```bash
npm run test:task5:bundle
npm run test:task5:ssr
npm run test:task5:browser
```

Delete `.next` in temporary mirror folders once verification is complete.

### 5c. Score and repair

Grade every item 0–3 using `references/quality-rubric.md`. Look up common causes and verified fixes in `references/repair-playbook.md` before guessing a workaround. Fix the lowest-scoring or highest-impact defect first, re-run cheap static gates right away, and re-verify in a browser round.

## 6. Finish

Summarize clearly in your PR or handoff notes:
- Files created/modified (keeping generated registries in sync via `npm run solutions:generate`).
- Gate results (`solutions:check`, `typecheck`, `lint`, `build`, plus bundle/SSR/browser checks where available).
- Hand calculation vs. model output vs. textbook answer side-by-side.
- Final rubric scores and any follow-up improvements noticed.
