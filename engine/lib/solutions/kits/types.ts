import type { ComponentType } from "react";

import type { BenchCanvasHandle } from "@/lib/solutions/bench/Stage";
import type { ContributorCredit, Cue, KitId, Vec3 } from "@/lib/solutions/types";
import type { LabStore } from "@/lib/solutions/viewer/store";

/** Every kit model exposes named times (for `cue.at`) and a duration. */
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

export interface KitModel {
  times: Record<string, number>;
  duration: number;
  /** Camera poses in scene units, sized to this problem. Used by posters. */
  cameraPresets?: Partial<Record<"front" | "side" | "top", CameraPose>>;
}

/** What a student can predict in Guess, and the 3D handle that sets it. */
export interface KitGuess<M extends KitModel> {
  label: string;
  unit: string;
  range(m: M): [number, number];
  truth(m: M): number;
  handle: "path" | "dial";
}

/** What What-if can change, and the 3D handle that changes it. */
export interface KitTunable {
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  handle: "dial" | "knob" | "slider";
  /** The `given` or `params` key this tunable sets on the kit model. */
  param: string;
  source: "given" | "params";
}

/** A named point on the bench, labelled with `PartLabels` when `showLabels`. */
export interface KitPart<M extends KitModel> {
  text: string;
  at(m: M): Vec3;
  /** A kit object name this part links to, if any (for the two-way scene link). */
  obj?: string;
  /** True while the part is in motion (e.g. the plunger during a flight). */
  moving?: boolean;
}

export interface KitDefinition<M extends KitModel = KitModel> {
  id: Exclude<KitId, "custom">;
  objects: readonly string[];
  credits?: ContributorCredit[];
  model(given: Record<string, number>, params?: Record<string, number>): M;
  /** Object name -> TeX for its scene label. Rendered to MathML on the server. */
  labels(given: Record<string, number>, params?: Record<string, number>): Record<string, string>;
  /** Named numbers the board, readout and challenges may use. */
  outputs: Record<string, (m: M) => number>;
  guesses: Record<string, KitGuess<M>>;
  tunables: Record<string, KitTunable>;
  /** Camera framings a step or a part can ask for. Must include `home` with zoom 1. */
  focuses: Record<string, (m: M) => { target: Vec3; zoom: number }>;
  parts: Record<string, KitPart<M>>;
  /** Metres to fit in the bench's viewport. */
  view(m: M): { width: number; height: number };
  /** The textbook page's footprint, in scene units (fixed per kit). */
  page: { x0: number; x1: number; depth: number; top: number };
}

export interface KitPosterProps {
  model: KitModel;
  cue: Cue;
  /** Physics time the poster shows (the step's resting state). */
  t: number;
  width: number;
  height: number;
  describe: string;
}

/** Props every lazily loaded 3D bench receives. */
export interface BenchProps {
  model: KitModel;
  numbers: Record<string, number>;
  cue: Cue | null;
  store: LabStore;
  labels: Record<string, string>;
  guess: string | null;
  tune: string | null;
  showLabels: boolean;
  /** Metres to fit in the bench's viewport (`kit.view(model)`). */
  view: { width: number; height: number };
  /** The textbook page's footprint, in scene units (`kit.page`). */
  page: { x0: number; x1: number; depth: number; top: number };
  /** Camera framings a step or a part can ask for, resolved for this model (`kit.focuses`). */
  focuses: Record<string, { target: Vec3; zoom: number }>;
  /** Named points for `PartLabels`, resolved for this model (`kit.parts`). */
  parts: { id: string; text: string; at: Vec3 }[];
  /** Reports the bench's imperative view handle to the host; `null` on unmount. */
  onHandle?(handle: BenchCanvasHandle | null): void;
  /** The WebGL context was lost; the host switches to the poster fallback. */
  onLost?(): void;
}

export type Bench = ComponentType<BenchProps>;

/**
 * Build a kit model with one tunable set to `tune`, leaving everything else at
 * its given/params value. Pure, so it is safe to call on the client (What-if's
 * live readout) as well as the server (payload building, `defineSolution`'s
 * challenge-range check).
 */
export function modelWithTune<M extends KitModel>(
  kit: KitDefinition<M>,
  numbers: Record<string, number>,
  kitParams: Record<string, number> | undefined,
  tunableName: string,
  tune: number,
): M {
  const tunable = kit.tunables[tunableName];
  if (tunable.source === "given") return kit.model({ ...numbers, [tunable.param]: tune }, kitParams);
  return kit.model(numbers, { ...(kitParams ?? {}), [tunable.param]: tune });
}
