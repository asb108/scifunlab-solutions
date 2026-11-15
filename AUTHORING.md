# Building solution labs: a guide for contributors & agents

This guide is for contributors and coding agents asked to add a textbook, a worked solution, or a 2D/3D bench to SciFunLab's solution labs. Read it all before writing code. The worked example is the `projectile` kit plus `hc-verma/solutions/samples/projectile-on-slope.ts`.

Files are portable between the main SciFunLab repo (`lib/solutions/kits/` and `lib/solutions/books/`) and the standalone open-source mirror repo (`kits/` and `books/`) because all kit and solution files import exclusively through `@scifunlab/solution-sdk*`.

## What a solution lab is

Each book question gets a page with a 3D comic "lab bench" and three tabs:

- **Guess**: the student predicts a number by moving something on the bench (a flag, a dial), then fires. Stars:
  3 within `tolerance`, 2 within 3×, else 1.
- **Solve**: the working, one step at a time. Each step writes lines on a chalkboard and frames the camera on what
  that step is about.
- **What if**: the student changes one input (a dial, knob or slider) and fires again. An optional challenge (find the
  best angle, hit a target) earns a stamp.

Three kinds of contribution exist:

| Contribution | You write | Typical size |
|---|---|---|
| **Solution job** | one `.ts` solution file importing `@scifunlab/solution-sdk` that reuses an existing kit | 60–120 lines, no custom UI |
| **Kit job** | a kit folder `<kit-id>/` with pure `model.ts`, 2D `Poster.tsx`, and interactive 2D or 3D `Bench.tsx` | 250–900 lines |
| **Book job** | a book folder `<book-id>/` with `map.ts`, `book.ts` (`defineBook`), and `solutions/*.ts` | 100–200 lines |

## Rules for every job

1. **Book content.** Cite the question (book, volume, chapter, section, number). Only the given values and the final answer
   come from the book. The setup sentence, step titles, board lines, descriptions and figures are written in our own
   words. Never copy the book's wording or figures.
2. **Stay inside your folder & SDK.** Do not edit host app files (`app/`, `engine/`, `components/`, `lib/db/`, etc.) or manually edit generated registry barrels (`kits/models.ts`, `kits/benches.ts`, `kits/posters.tsx`, `books/catalog.ts`, `books/solutions.ts`, `books/*/solutions/index.ts`). Run `npm run solutions:generate` instead — every registry barrel is regenerated deterministically from `books/` and `kits/` with zero merge conflicts.
3. **Allowed imports (enforced by ESLint sandbox rules).**
   - Solution files (`books/**/solutions/**/*.ts`): only `@scifunlab/solution-sdk`. No `eval`, `fetch`, `process`, DOM, React, or host imports.
   - Book metadata (`books/<book>/{book,map}.ts`): only `@scifunlab/solution-sdk` or local `./<file>`.
   - Kit `model.ts`: only `@scifunlab/solution-sdk/kit` or local `./<file>` (must run identically on server & browser).
   - Kit `Poster.tsx` / `Bench.tsx` (supports both 2D SVG/Canvas/React animations and 3D React Three Fiber benches): `@scifunlab/solution-sdk/kit`, `@scifunlab/solution-sdk/bench`, `react`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, or local `./<file>`.
4. **Contributor attribution (`credits`).** Optionally add `credits: [{ name: "Your Name", github: "your-handle", role: "author" }]` (`"author" | "bench" | "reviewer"`) on `defineSolution(...)` or `KitDefinition`. Invalid GitHub handles fail `solutions:check`.
5. **Gates to run before finishing** (Node 20):
   ```bash
   npm run solutions:generate
   npm run solutions:check
   npm run typecheck
   npm run lint
   ```
   `solutions:check` verifies generated barrels are in sync and validates every `defineSolution` rule (board line length, names, challenge range, contributor handles) without a full build.
6. **Main-repo maintainers (OSS sync commands):**
   - Export clean standalone open-source repository: `npm run solutions:export-oss -- --out <dir>`
   - Import and verify contributions from a directory or `https://` Git repo: `npm run solutions:import-oss -- --from <dir-or-repo> [--ref <branch>] [--prune]`

## Solution job: the data file

Import helpers from `@scifunlab/solution-sdk` and copy the shape of `samples/blocks-on-pulley.ts`. Notice `default export` is required for automatic discovery. The fields that matter:

```ts
import { defineSolution, restTime } from "@scifunlab/solution-sdk";

export default defineSolution({
  citation: { book: "hc-verma", volume: 1, chapter: 3, section: "exercise", number: 12 },
  title: "…our own short title…",
  inShort: "…one sentence, our own words…",
  given: { u: [10, "m/s"], theta: [45, "deg", "\\theta"] },   // [value, unit, optional TeX symbol]
  kitParams: { … },            // kit-specific extras that are not book givens
  topics: ["projectile-motion"], difficulty: 2, access: "free", kit: "projectile",
  credits: [{ name: "Ada Lovelace", github: "adalovelace", role: "author" }],
  guess: { use: "landing", tolerance: 0.5 },          // a key of the kit's `guesses`, or "none"
  whatIf: { tune: "theta", challenge: { kind: "max", of: "range", label: "Best angle", why: "45° + α/2" } },
  steps: [ { title, board: [...], describe, cue: { show, highlight?, at?, focus? } }, … ],
  answer: { value: 7.73, unit: "m", label: "Distance up the slope" },
});
```

- `guess.use`, `whatIf.tune` and `challenge.of` must be names the kit defines (`guesses`, `tunables`, `outputs`).
- A `max`/`min` challenge whose best value sits at the edge of the tunable's range is rejected: pick a range where the
  best lies inside.
- `cue.show` / `highlight` use the kit's `objects` names. `cue.focus` is a key of the kit's `focuses`. `cue.at` is a
  number (seconds) or a key of the model's `times`; the ball (or block) rests there for that step.
- `describe` is the text a screen reader hears for that step's figure: say what is visible, plainly.

### Board lines

Each step has 1–4 board lines. A line is at most **38 characters** after numbers are filled in. Markup:

| Markup | Meaning |
|---|---|
| `blue:` `green:` `pink:` `yellow:` at the start | chalk colour (default white) |
| `lg:` `sm:` after any colour | size |
| `u_x`, `u_{xy}`, `t^2` | subscript, superscript |
| `{ux}`, `{ux:3}` | a kit output or given value, 2 (or n) decimals; `{alpha:0}` for whole numbers |
| `((text\|circle))`, `\|box`, `\|underline` | a hand-drawn mark around a result |
| `[[obj\|text]]` | links the words to a scene object |
| `!tick` at the end | a hand-drawn tick (use once, on the answer line) |

Every computed number on the board comes from a placeholder, never typed in, so the board, the readout and the bench
can never disagree. When a line subtracts two intermediate terms, show them with 3 decimals so the board's own
arithmetic checks out (`{uxT:3} − {drag:3} = {range}`). End the last step with the boxed answer and `!tick`.

## Kit job: a new bench

Read the whole `projectile` kit first. Each kit folder contains three primary files:

1. **`model.ts`**: import `{ modelWithTune, restTime, type KitDefinition, type KitModel }` from `"@scifunlab/solution-sdk/kit"` and export `<camelId>Kit` (ending in `Kit`, e.g. `projectileKit`): `objects`,
   `model(given, params)`, `labels`, `outputs`, `guesses`, `tunables`, `focuses` (must include `home` with zoom 1),
   `parts` (named points for the label pills), `view` (metres to fit), `page` (the textbook page footprint). No React,
   no three.js: it runs on the server and the client. Check every number against the book answer by hand in a comment.
2. **`Poster.tsx`**: import `{ type KitPosterProps }` from `"@scifunlab/solution-sdk/kit"` and your model from `"./model"`, and export `<PascalId>Poster` (ending in `Poster`, e.g. `ProjectilePoster`) — the server-rendered 2D SVG for each step (shown before 3D loads and when WebGL is missing).
3. **`Bench.tsx`**: `"use client"; export default function XBench(props: BenchProps)`. Import 3D bench primitives from `"@scifunlab/solution-sdk/bench"`, never from raw host internals:
   - `BenchCanvas`: page, lights, camera, demand frame loop, touch policy. Pass
     `view`, `page`, `focus`, `handleRef`, `onLost` from props; report the handle with `props.onHandle`.
   - `Box`, `Cyl`, `Ball`, `Screw`, and `tone`: comic ink outlines and shared palette.
   - `PathHandle`, `DialHandle`, `PressButton`: interactive controls (`store.setGuess`, `store.setTune`, `store.fire()`).
   - `Guide`: the bobbing "↔ Drag the flag" tags that tell students what to touch.
   - `DashedPath`, `Ghosts`, `ValueTag`, `Tape`, `PartLabels`: trail overlays and labels when `props.showLabels`.
   - Read state with `useLab(props.store, s => …)`. Call `props.store.landed(firedAt)` exactly once per fire, when the
     motion ends. Keep motion at 55% speed so the eye can follow.
   - Anything that animates must call `useKeepDrawing(true)` while it moves (the frame loop is on demand: an idle bench
     must stop rendering).

### The look

Keep the established SciFunLab comic style (tilted, inked, bright). The bench is a real, well-made instrument on a
base: feet, rails, scales with ticks, clamps, knobs, screws. Every part rests on another part; nothing floats. Use the
`tone` palette: base `#6FA8FF`, trim `#FFDE59`, structure `#FF5A5F`, teal `#2EC4B6`, plank `#FFC93C`, metal
`#EEF2FC`, brass `#FFB627`, the moving subject in magenta `#FF2E88`; vectors in velocity `#5B50FF`, force `#FF5050`,
acceleration `#4ADE80`, field `#FFDE59`.

## Better tools

The shared pieces above are the proven default, not the only option. If you know a better library, shader, modelling
route, audit tool or native skill for part of the job, use it. Keep the data contract, the lab loop, the comic look,
the accessibility and no-WebGL paths, the book-content rule, the budgets and the gates fixed. Load any new runtime
dependency lazily with the bench, name it in your report with its size, and say what worked so it can be added here.

## How reviewers and CI verify your work

Before opening a PR or finalizing a solution/kit, verify your own work against the 12-point rubric in
`docs/solutions/agent-skill/scifunlab-solution-lab/references/quality-rubric.md` (see common causes and fixes in
`docs/solutions/agent-skill/scifunlab-solution-lab/references/repair-playbook.md`). Check every step by hand:
physics values against the textbook, chalkboard arithmetic (`<= 38` chars per line), and all static gates (`npm run solutions:generate`, `npm run solutions:check`, `npm run typecheck`, `npm run lint`).

To start a new solution file with valid imports and citations in one command, run `npm run solutions:new -- --list` to inspect books and kits, then scaffold with `npm run solutions:new`. In live browser verification (`npm run build && npm run start`), check both desktop (`1280×900`) and mobile (`390×844`) viewports plus `?nowebgl` poster fallback: Guess → release/fire → stars; Solve step switching with chalkboard marks and part highlights; What if tuning; non-overlapping labels; and zero console/page errors. Main-repo PRs also satisfy bundle budget, SSR boundaries (`npm run test:task5:bundle && npm run test:task5:ssr && npm run test:task5:browser`), and Lighthouse targets (`accessibility >= 0.98`, `performance >= 0.9`). Physics that contradicts the book answer, floating instrument geometry, or board arithmetic that fails to add up will be requested for revision.
