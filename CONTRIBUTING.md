# Contributing to SciFunLab Textbook Solutions

Thank you for helping build free, interactive 2D & 3D textbook solutions!

## Ground Rules

1. **Original phrasing only**: Write every problem statement, hint, step, and label in your own words. Never copy wording or figures verbatim from any textbook.
2. **Stay inside the SDK**:
   - Solution files (`books/**/solutions/**/*.ts`) may only import from `@scifunlab/solution-sdk`.
   - Kit `model.ts` files may only import from `@scifunlab/solution-sdk/kit` (or pure `./` helpers in the same kit folder).
   - Kit `Poster.tsx` and `Bench.tsx` files (2D SVG/Canvas or 3D React Three Fiber) may import `@scifunlab/solution-sdk/kit`, `@scifunlab/solution-sdk/bench`, `react`, `three`, `@react-three/fiber`, `@react-three/drei`, and local `./` helpers.
3. **Never edit `engine/` or `app/`** in content PRs — those directories mirror the main SciFunLab viewer and are overwritten by upstream syncs.
4. **Claim attribution cleanly** using the `credits` field:
   ```ts
   credits: [{ name: "Your Name", github: "your-handle", role: "author" }]
   ```
   (Use `role: "bench"` for 2D/3D kits or `role: "reviewer"` for pedagogy/physics checks.)
5. **Regenerate registries and run all gates** before pushing:
   ```bash
   npm run solutions:generate
   npm run solutions:check
   npm run typecheck
   npm run lint
   npm run build
   ```
