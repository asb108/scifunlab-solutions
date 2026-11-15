# SciFunLab Open Textbook Solutions

Open-source repository for interactive 2D & 3D worked textbook solutions, physics simulation kits, SVG/Canvas diagrams, and animated React Three Fiber benches published on [SciFunLab](https://www.scifunlab.com/solutions).

Every question here is an interactive mini-lab: **Guess** (act before reading) -> **Solve** (step-by-step chalkboard + highlighted diagram) -> **What if** (live parameter exploration).

## Choose Your Contribution Path

| Path | Best For | Effort | Where to Edit |
|---|---|---|---|
| **1. Add a Textbook Solution** | First PRs & physics problem solving | ~10 min | `books/<book>/solutions/ch-XX/<section>-<n>.ts` (use `npm run solutions:new`) |
| **2. Build a 2D or 3D Simulation Kit** | Visualizers, 3D R3F apparatus, 2D SVG/Motion labs | ~1–2 hrs | `kits/<kit-id>/{model.ts, Poster.tsx, Bench.tsx}` + sample solution |
| **3. Polish Hints & Explanations** | Pedagogy clarity, accessible descriptions, bug fixes | ~10 min | Existing files under `books/` or `kits/` |

## 5-Minute First Contribution

```bash
# 1. Install dependencies
npm install

# 2. See all books, valid sections, and reusable kits (objects, outputs, guesses, tunables, focuses)
npm run solutions:new -- --list

# 3. Scaffold a starter solution file and refresh registries automatically
npm run solutions:new -- \
  --book hc-verma --chapter 3 --section exercise --number 45 \
  --kit projectile --title "Short Original Title" \
  --name "Your Name" --github your-handle

# 4. Preview live at http://localhost:3000/solutions
npm run dev
```

## Repository Layout

- `books/<book-id>/`: Textbook metadata (`book.ts`), chapter index (`map.ts`), and declarative solution files (`solutions/**/*.ts`).
- `kits/<kit-id>/`: Reusable 2D/3D simulation kits (`model.ts`, `Poster.tsx`, `Bench.tsx`).
- `docs/solutions/`: Authoring workflow skill, 12-point quality rubric, repair playbook, and ready-to-use agent job briefs.
- `engine/` and `app/`: Synced SciFunLab viewer runtime, chalkboard, comic UI, and `@scifunlab/solution-sdk`. Maintained upstream — do not edit in PRs.
- `AUTHORING.md` & `CONTRIBUTING.md`: Full spec, SDK boundaries, and beginner walkthrough.

## Built-In Starter Kits

Run `npm run solutions:new -- --list` for the exact fields of every kit currently installed:
- `projectile`: Slanted/level ballistic launch bench (velocity vector split, trajectory, range guess, launch angle What-if).
- `blocks`: Coupled block-and-pulley incline/table bench (normal force, friction, tension, 1-second drop guess, hanging mass What-if).
- `field`: Two-charge electric field rail & probe bench (component field vectors, net field angle guess, charge spacing What-if).

## Before Opening a PR

```bash
npm run solutions:generate
npm run solutions:check
npm run typecheck
npm run lint
npm run build
```

See [CONTRIBUTING.md](./CONTRIBUTING.md), [AUTHORING.md](./AUTHORING.md), and the [Solution Lab Guide](./docs/solutions/agent-skill/scifunlab-solution-lab/SKILL.md) to get started!
