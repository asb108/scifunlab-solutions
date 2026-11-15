import type { BoardLineHtml } from "@/lib/solutions/board";
import type { Challenge } from "@/lib/solutions/challenge";
import type { KitModel } from "@/lib/solutions/kits/types";
import type { Cue, KitId, Vec3 } from "@/lib/solutions/types";

/** One step as the client sees it: HTML already rendered on the server. */
export interface ViewerPredict {
  questionHtml: string;
  optionsHtml: string[];
  answer: number;
  revealHtml: string;
}

export interface LabStep {
  titleHtml: string;
  lines: BoardLineHtml[];
  describe: string;
  cue: Cue;
  predict?: ViewerPredict;
}

export interface LabGuess {
  use: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  truth: number;
  tolerance: number;
}

export interface LabWhatIf {
  tune: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  book: number;
  challenge?: Challenge & { bestTune: number; best: number };
}

/**
 * Everything the client lab receives. The server page builds it and only
 * includes the steps this visitor may see, so locked steps' board lines and
 * What-if data never reach the browser.
 */
export interface LabPayload {
  id: string;
  kit: Exclude<KitId, "custom">;
  numbers: Record<string, number>;
  kitParams?: Record<string, number>;
  steps: LabStep[];
  guess: LabGuess | null;
  whatIf: LabWhatIf | null;
  /** Object name -> MathML for scene labels. */
  labels: Record<string, string>;
  locked: boolean;
  page: { x0: number; x1: number; depth: number; top: number };
  view: { width: number; height: number };
  focuses: Record<string, { target: Vec3; zoom: number }>;
  parts: { id: string; text: string; at: Vec3 }[];
}

/** The physics time a step's cue rests at: `at` as seconds, as a model time name, or the model's duration. */
export function restTime(model: KitModel, cue: Cue): number {
  const at = cue.at;
  if (typeof at === "number") return at;
  if (typeof at === "string") return model.times[at];
  return model.duration;
}
