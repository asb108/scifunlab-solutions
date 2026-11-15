/**
 * Public SDK entrypoint for textbook definitions and problem solution data files.
 * Kept free of UI or Three.js dependencies so solution validation runs cleanly
 * in Node CI checks and during Next.js static builds.
 */
export { defineBook, chapterSlug, type BookDefinition, type Chapter, type ChapterGroup } from "@/lib/solutions/books/types";
export { defineSolution, givenNumbers } from "@/lib/solutions/defineSolution";
export { modelWithTune } from "@/lib/solutions/kits/types";
export { restTime } from "@/lib/solutions/viewer/payload";
export type {
  Access,
  Answer,
  Challenge,
  Citation,
  ContributorCredit,
  Cue,
  GivenEntry,
  GivenValue,
  KitId,
  Predict,
  SectionId,
  Solution,
  SolutionInput,
  Step,
  Vec3,
} from "@/lib/solutions/types";
export type {
  BenchProps,
  CameraPose,
  KitDefinition,
  KitGuess,
  KitModel,
  KitPart,
  KitPosterProps,
  KitTunable,
} from "@/lib/solutions/kits/types";
