import type { RegisteredKitId } from "@/lib/solutions/kits/models";

/**
 * Data model for book solutions. A solution file describes one book question:
 * how we cite it, the book's given values, our own setup and working, and the
 * kit cues that drive the lab bench.
 */

export type KitId = RegisteredKitId | "custom";
export type Access = "free" | "subscriber" | "coming-soon";
export type SectionId = "short-answer" | "objective-1" | "objective-2" | "exercise" | "sample";

export interface ContributorCredit {
  name: string;
  github?: string;
  role?: "author" | "bench" | "reviewer";
}

export interface Citation {
  book: string;
  volume: 1 | 2;
  chapter: number;
  section: SectionId;
  number: number;
}

/** `[value, unit]` or `[value, unit, labelTex]`. The label defaults to the key. */
export type GivenEntry = [value: number, unit: string] | [value: number, unit: string, labelTex: string];

export interface GivenValue {
  key: string;
  value: number;
  unit: string;
  labelTex: string;
}

export type Vec3 = [number, number, number];

export interface Cue {
  /** Kit object names visible during this step. */
  show: string[];
  /** Kit object names drawn with emphasis. Must also be in `show`. */
  highlight?: string[];
  /** The physics time this step rests at: seconds, or a model time name such as "tFlight". */
  at?: number | string;
  /** A kit focus name the camera eases to for this step. */
  focus?: string;
  /** Short label placed in the scene. */
  note?: string;
}

export interface Predict {
  /** A quick question the student answers before the step plays. */
  question: string;
  options: string[];
  /** Index of the right option. */
  answer: number;
  /** One line shown after answering. */
  reveal: string;
}

/**
 * A quantity a student can chase in What if: `max`/`min` of a kit output over
 * the tunable's range, or `target` (reach a value within `tolerance`).
 */
export interface Challenge {
  kind: "max" | "min" | "target";
  of: string;
  target?: number;
  tolerance?: number;
  label: string;
  why: string;
}

export interface Step {
  title: string;
  /**
   * Our own working, one chalkboard line per entry. See `lib/solutions/board.ts`
   * for the markup (colour, size, subscript/superscript, placeholders, marks,
   * scene links and the hand-drawn tick).
   */
  board: string[];
  predict?: Predict;
  /** One sentence describing what the scene shows, read to screen readers. */
  describe: string;
  cue: Cue;
}

export interface Answer {
  value: number;
  unit: string;
  label: string;
  /** Optional TeX for how the answer is shown, e.g. "5.09\\times10^{6}\\,\\mathrm{N/C}". */
  tex?: string;
}

export interface SolutionInput {
  citation: Citation;
  title: string;
  /** One line in our own words. Never the book's wording. */
  inShort: string;
  given: Record<string, GivenEntry>;
  topics: string[];
  difficulty: 1 | 2 | 3;
  access: Access;
  kit: KitId;
  kitParams?: Record<string, number>;
  steps: Step[];
  answer: Answer;
  relatedLab?: string;
  /** Which kit guess the Guess tab predicts, or "none" for a question with no single number. */
  guess: { use: string; tolerance: number } | "none";
  /** The kit tunable What if changes, and an optional challenge to chase. */
  whatIf?: { tune: string; challenge?: Challenge };
  /** Our own problem, used to build and check the framework. Not a book question. */
  sample?: boolean;
  /** Contributors who authored or improved this solution. */
  credits?: ContributorCredit[];
}

export interface Solution extends Omit<SolutionInput, "given"> {
  slug: string;
  chapterSlug: string;
  given: GivenValue[];
}
