# Kit job: the `<KIT>` interactive lab kit (2D or 3D)

Read `lib/solutions/kits/AUTHORING.md` (or `AUTHORING.md` in the OSS repo), study `kits/projectile/` (`model.ts`, `Poster.tsx`, `Bench.tsx`) as the visual & architectural reference, and inspect the shared SDK primitives (`@scifunlab/solution-sdk/kit` and `@scifunlab/solution-sdk/bench`).

## Target folder
- Main repo: `lib/solutions/kits/<kit>/` + starter solution under `lib/solutions/books/<book>/solutions/`
- OSS repo (`scifunlab-solutions`): `kits/<kit>/` + starter solution under `books/<book>/solutions/`

Do NOT hand-edit `models.ts`, `benches.ts`, `posters.tsx`, `catalog.ts`, `solutions.ts`, or `books/*/solutions/index.ts` — regenerate them with `npm run solutions:generate`. Never edit `engine/` or `app/` in a kit PR.

## Physics & instrument plan
- **Apparatus type**: `<3D R3F bench | 2D interactive SVG/Canvas + Motion bench>` (both are first-class; keep WebGL/DOM code out of `model.ts` and `Poster.tsx`).
- **Instrument geometry & moving parts**: `<base plate/frame, scales with ticks, clamps, handles, moving bodies, vector overlays>`
- **Book check values `model.ts` must match**: `<known input sets -> expected analytical outputs>`
- **Guess interaction**: `<guess name>` — handle `<path | dial | custom pointer + keyboard/aria fallback>` — `<what student sets>`
- **What-if tunable**: `<tunable name>` — range `[min, max]`, `step`, `<what student explores>`
- **Parts & camera/focus landmarks**: `home`, `<landmark 1>`, `<landmark 2>`

## Implementation rules
1. **`model.ts`**:
   - May ONLY import `@scifunlab/solution-sdk/kit` or pure `./` helpers in the same kit folder.
   - Pure physics computation, camera presets / viewport bounds, parts, objects, outputs, guesses, tunables, `times`.
2. **`Poster.tsx`**:
   - Export `<PascalKit>Poster` (server-safe SVG fallback for `?nowebgl` and initial SSR frame). Never import `three`, `@react-three/*`, or `"use client"` modules.
   - Support completing `Guess` directly in poster mode (`store.landed(firedAt)` via timer when `mode === "poster" && phase === "flying"`).
3. **`Bench.tsx`**:
   - `"use client"` lazy-loaded visual bench (`default` React export receiving `BenchProps`).
   - Allowed imports: `@scifunlab/solution-sdk/kit`, `@scifunlab/solution-sdk/bench`, `react`, `framer-motion`, `three`, `@react-three/fiber`, `@react-three/drei`, and local `./` modules.
   - Idle demand-rendering (`useKeepDrawing(true)` ONLY while moving), mobile vertical scroll safety (`touch-action: pan-y`), full keyboard/ARIA accessibility.

## Verification gates (must be clean)

```bash
npm run solutions:generate
npm run solutions:check
npm run typecheck
npm run lint
npm run build
```

Then verify the live page visually at `1280x900`, `390x844`, and `?nowebgl` (Guess → fire → stars, Solve steps + highlights + board working, What if live readout, zero console/page errors).

## Report
- Files created under `<kit>/` and starter solution file
- Model check values side-by-side with hand math / textbook answer
- Gate results (`solutions:check`, `typecheck`, `lint`, `build`) and live browser checks
