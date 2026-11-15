# Repair playbook

Real failure modes observed across `projectile`, `blocks`, `field`, registry generation, and OSS sandboxing — paired with root causes and fixes.

## Physics and numbers

| Symptom | Likely cause | Fix |
|---|---|---|
| Answer off by a few percent | `g = 9.8` vs `10`, or degrees passed to `Math.sin` | Match the book's stated `g`; convert degrees to radians once at the top of `buildModel` |
| Negative acceleration or block slides backward | Friction applied blindly against driving force | Clamp driving net force: `a = Math.max(0, drive - f) / totalMass`; handle static equilibrium cleanly |
| Board arithmetic looks off by `0.01` (`7.73 − 0.42 ≠ 7.30`) | Intermediate values displayed at 2 decimals | Format subtracted intermediate terms with `{name:3}` in the chalkboard string |
| `solutions:check` rejects `What if` challenge | Best `max`/`min` value lies within `step/2` of `[min, max]` endpoint | Widen/shift the tunable range in `model.ts` or switch to a `target` challenge inside the interior |
| Challenge `why` contradicts live numbers | Explanation written from intuition without substituting values | Compute both endpoints and the optimum directly from `kit.model(given)` before writing `why` |
| Problem's apparatus does not match kit geometry | Trying to force an incompatible setup onto `projectile` / `blocks` / `field` | Check physical assumptions first (e.g., `projectile/Bench` barrel sits at `h = 0`; `field/Bench` renders one `+` and one `-` charge within rail span). Pick a fitting question or build a dedicated 2D/3D kit |

## Lab loop and state

| Symptom | Likely cause | Fix |
|---|---|---|
| Stars never appear in `?nowebgl` poster mode | `landed()` only wired to 3D `useFrame` loop | Trigger `store.landed(firedAt)` from a timer effect in poster mode when `phase === "flying"` |
| Score or attempt counted twice | `landed()` called from two effects | Call `store.landed(firedAt)` once at motion end and keep the fire token guard |
| Guess starts already on the solution | Default guess equals `outputs[guess.use]` | Start default guess safely away from truth in `Poster.tsx` / `Bench.tsx` |
| Drag stays stuck after touch interruption | Only `pointerup` listened | Release drag on `pointerup`, `pointercancel`, and `lostpointercapture` |
| Next Solution page shows wrong step count / empty tab | `steps` array has `< 2` entries | Author at least 2 clear pedagogy steps (typically 3–5) per solution |

## 2D, 3D, and rendering

| Symptom | Likely cause | Fix |
|---|---|---|
| Bench burns 100% GPU while idle | Unconditional `invalidate()` or always-on animation loop | Call `useKeepDrawing(true)` ONLY while motion or camera easing is active |
| Mobile swipe over bench locks page scroll | Orbit/drag wrapper sets `touch-action: none` | Keep `touch-action: pan-y` on canvas wrappers so vertical swipes scroll the page |
| Parts float or intersect adjacent parts | Y coordinates hardcoded independently | Stack each component cleanly off the surface top of the part supporting it |
| Chalkboard marks fail to draw on step change | SVG path not remounted when cue resets | Key animated SVG mark paths on step index + timing state |
| Labels overlap or clip near canvas edges | Per-part uncoordinated `Html` overlays | Use shared `PartLabels` edge layout (or clean non-overlapping SVG label lanes in 2D posters/benches) |

## ESLint, registries, and bundle budgets

| Symptom | Likely cause | Fix |
|---|---|---|
| ESLint rejects import in solution file | Importing `@/lib/...`, React, or local helper inside `solutions/*.ts` | Contributed solution files may ONLY import `@scifunlab/solution-sdk` |
| ESLint rejects import in `kits/<id>/model.ts` | Importing `three` or React in pure model file | Keep `model.ts` framework-free; import only `@scifunlab/solution-sdk/kit` or pure `./` helpers |
| `solutions:check` says registries are out of date | Added/edited kit or solution file without regenerating | Run `npm run solutions:generate` (or create new files via `npm run solutions:new`) |
| `credits` check fails in `solutions:check` | Invalid `github` handle format | Use a valid GitHub username (`^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$`) or omit `github` |
| Main-repo bundle ratchet fails on SSR/client budget | Client/Three code imported into `model.ts` or server page | Keep `three` / `@react-three/*` / client hooks exclusively inside `Bench.tsx` (dynamically loaded via `benches.ts`) |
