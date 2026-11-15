# Solution-lab quality rubric

Score each item 0–3 strictly from observed evidence (numbers, browser checks, screenshots, gate output), never from intent. Target is **3** unless otherwise noted. Any **0** blocks acceptance.

| # | Item | 0 | 1 | 2 | 3 (target) |
|---|---|---|---|---|---|
| 1 | **Physics truth** | answer disagrees with textbook | matches only via ad-hoc tweaks | matches; some displayed number hardcoded | every number on board, readout, and bench comes from one pure `model.ts` and matches hand math + textbook within rounding |
| 2 | **Board working** | lines over 38 chars or wrong arithmetic | adds up but unclear | clear; one step slightly crowded | 1–4 lines per step, `<= 38` chars/line, subtracted intermediate terms at `{v:3}`, final answer boxed with `!tick` |
| 3 | **Act before read (Guess)** | no interactive guess | plain form input only | interactive control present, hard to spot or grab | direct handle on the 2D/3D bench, clear guide tag, fair tolerance, starts away from the true answer |
| 4 | **Motion you can follow** | static or teleports | moves, too fast or off-path | accurate path; missing trail/ghosts | smooth 55% motion speed (2D/3D) with clear trajectory/state feedback, landing exactly where the model computes |
| 5 | **Steps frame the idea** | steps ignore visuals | focus shifts awkwardly | right framing, missing cue highlight | each step frames its subject cleanly, highlights the relevant part, and triggers chalkboard marks on cue |
| 6 | **What if teaches** | broken or missing | control works, teaches nothing | live readout without intuition prompt | tunable parameter updates model live with readable delta and clear challenge whose solution lies smoothly inside range |
| 7 | **Real instrument / clear apparatus** | floating or vague primitives | recognizable but bare | solid; minor alignment gap | grounded 2D/3D instrument with crisp scales, ticks, supports, or schematic cues; every part rests cleanly; readable at 1x and zoomed |
| 8 | **SciFunLab look** | off-palette or muddled contrast | palette right, outlines inconsistent | style right with minor mismatch | crisp high-contrast comic paper/ink style (`tone` palette), fixed vector colors, matches existing benches |
| 9 | **Labels and guides** | overlapping or clipped text | readable on desktop only | minor crowding at narrow widths | pills/tags never clip or collide; phone shows compact labels; helper guides clear after first interaction |
| 10 | **Accessibility & fallbacks** | cannot complete Guess via keyboard or `?nowebgl` | keyboard works; `?nowebgl` broken | both work with minor friction | keyboard + screen reader complete every control; `?nowebgl` `Poster.tsx` completes Guess; reduced motion works cleanly; mobile scrolls past bench |
| 11 | **Robustness** | runtime errors or stuck flight state | errors in edge interactions | clean normal flow; minor race on rapid clicks | zero console/page errors; double-fire, mid-flight tab switches, and WebGL fallback recover cleanly |
| 12 | **Gates & budgets** (target 2 for OSS PRs if browser bundle ratchet unavailable) | fails static checks or exceeds budget | checks incomplete | `solutions:check`, `typecheck`, `lint`, `build` green | all static gates, `next build`, bundle ratchet, SSR check, and live browser checks (desktop + mobile + `?nowebgl`) green |

## Honest review checklist

- Inspect tight crops (`1280×900` desktop and `390×844` phone), not just thumbnails: overlapping callouts and floating supports hide at small preview sizes.
- An item you did not verify directly scores at most **1** ("not verified"), never 3.
- Compare a new kit side-by-side against `kits/projectile/` (`Bench.tsx` and `Poster.tsx`). If readability or polish lags noticeably behind, Item 7 is not 3.
