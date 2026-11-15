/**
 * Client-and-server safe SDK entrypoint for pure kit models (`model.ts`) and
 * server-rendered SVG posters (`Poster.tsx`). Never imports `server-only` or `three`.
 */
export { modelWithTune } from "@/lib/solutions/kits/types";
export { restTime } from "@/lib/solutions/viewer/payload";
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
export type { ContributorCredit, Cue, KitId, Vec3 } from "@/lib/solutions/types";
