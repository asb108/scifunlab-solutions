# Contributing to SciFunLab Textbook Solutions

Welcome! Whether this is your very first open-source PR or your hundredth 3D physics sim, this repo is designed so you can go from fork to verified preview in minutes.

## Your First PR in 5 Minutes

1. **Fork & clone** `asb108/scifunlab-solutions`, then create a topic branch:
   ```bash
   git checkout -b feat/hc-verma-ch3-ex45
   npm install
   ```
2. **Inspect available books and kits:**
   ```bash
   npm run solutions:new -- --list
   ```
   This prints every textbook ID, chapter range, valid section (`exercise`, `objective-1`, `objective-2`, `short-answer`, `sample`), and each kit's `objects`, `outputs`, `guesses`, `tunables`, and `focuses`.
3. **Scaffold your file** with one command:
   ```bash
   npm run solutions:new -- \
     --book hc-verma --chapter 3 --section exercise --number 45 \
     --kit projectile --title "Bank throw into a river boat" \
     --name "Your Name" --github your-handle
   ```
4. **Write the physics & chalkboard steps** cleanly inside the generated file:
   - Write `inShort`, step titles, `board` lines, `describe`, and `whatIf.challenge.why` in your **own original words** (only numerical givens and the numerical target come from the textbook).
   - Keep every `board` line `<= 38` rendered characters and end the last line of the last step with `!tick`.
   - Start `guess` values away from the true answer so learners think before testing.
5. **Preview in your browser:**
   ```bash
   npm run dev
   ```
   Open the preview route printed by `solutions:new` (for example `http://localhost:3000/solutions/hc-verma/...`), verify **Guess -> Solve -> What if**, and test `?nowebgl` poster fallback too.
6. **Run all local CI checks before pushing:**
   ```bash
   npm run solutions:generate
   npm run solutions:check
   npm run typecheck
   npm run lint
   npm run build
   ```

## SDK & Sandbox Rules (Enforced by ESLint)

1. **Solution files** (`books/**/solutions/**/*.ts`):
   - May ONLY import from `@scifunlab/solution-sdk`. No React, DOM, `process`, `fetch`, `eval`, or external imports.
2. **Kit models** (`kits/*/model.ts`):
   - May ONLY import from `@scifunlab/solution-sdk/kit` (or pure `./<file>` helpers inside the same kit folder). Never import `three` or React.
3. **Kit Posters & 2D/3D Benches** (`kits/*/{Poster.tsx,Bench.tsx}`):
   - Allowed imports: `@scifunlab/solution-sdk/kit`, `@scifunlab/solution-sdk/bench`, `react`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, and local `./<file>` helpers.
   - Both **2D interactive labs** (SVG / Canvas / Framer Motion) and **3D React Three Fiber labs** are welcome!
4. **Upstream engine**: Never edit `engine/` or `app/` in content PRs — they mirror the main SciFunLab website and are overwritten during syncs.

## Minimal Solution Cheat Sheet

```ts
// Prefixes (no space after ":"): "yellow:", "blue:", "green:", "pink:" (plain line = white), optional "sm:" or "lg:" (e.g. "green:lg:...")
// Emphasis: "((text|box))", "((text|circle))", "((text|underline))"
// Placeholders: "{range}" (2 decimals) or "{uxT:3}" (3 decimals for subtracted terms)
// Links: "[[ball|the projectile]]" (must exist in kit.objects)
// Tick mark on final step's final line: "!tick"
```

## Contributor Attribution (`credits`)

Every published solution renders your badge at the bottom of the page:
```ts
credits: [{ name: "Your Name", github: "your-handle", role: "author" }]
```
Roles: `"author"` (solution authoring), `"bench"` (2D/3D kit visuals), `"reviewer"` (physics/pedagogy audit).

## Common Gate Errors & Quick Fixes

| Error | Fix |
|---|---|
| `Contributed solution files may only import from "@scifunlab/solution-sdk"` | Remove extra imports; keep only `import { defineSolution } from "@scifunlab/solution-sdk"`. |
| `Generated solution registries are out of date` | Run `npm run solutions:generate` and commit updated registry files. |
| `board line ... exceeds 38 characters` | Shorten wording or split an equation onto two lines (`1–4` lines per step). |
| `Challenge best value sits at the edge` | Shift `given` / `whatIf` challenge to a `target` inside the tunable's range. |
| `invalid GitHub handle` | Use your exact GitHub username without `@` or URL prefix. |

Also see [AUTHORING.md](./AUTHORING.md), the [12-point quality rubric](./docs/solutions/agent-skill/scifunlab-solution-lab/references/quality-rubric.md), and the [repair playbook](./docs/solutions/agent-skill/scifunlab-solution-lab/references/repair-playbook.md).
