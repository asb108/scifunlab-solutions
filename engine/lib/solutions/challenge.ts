export type { Challenge } from "@/lib/solutions/types";
import type { Challenge } from "@/lib/solutions/types";

export function challengeBest(
  evaluate: (tune: number) => number,
  range: { min: number; max: number; step: number },
  kind: "max" | "min",
): { tune: number; value: number } {
  let bestTune = range.min;
  let bestValue = evaluate(range.min);
  for (let t = range.min + range.step; t <= range.max + 1e-9; t += range.step) {
    const v = evaluate(t);
    const better = kind === "max" ? v > bestValue : v < bestValue;
    if (better) {
      bestValue = v;
      bestTune = t;
    }
  }
  return { tune: bestTune, value: bestValue };
}

export function meetsChallenge(value: number, best: number, challenge: Challenge): boolean {
  if (challenge.kind === "max") return value >= 0.995 * best;
  if (challenge.kind === "min") return value <= best + 0.005 * Math.abs(best);
  const target = challenge.target ?? 0;
  const tol = challenge.tolerance ?? 0.005 * Math.abs(target);
  return Math.abs(value - target) <= tol;
}
