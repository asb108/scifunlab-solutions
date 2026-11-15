"use client";

/**
 * Client-only 3D comic workbench primitives exported for contributed kit `Bench.tsx`
 * implementations under `@scifunlab/solution-sdk/bench`.
 */
export { DialHandle, PathHandle, PressButton } from "@/lib/solutions/bench/controls";
export { DashedPath, Ghosts, Tape, ValueTag } from "@/lib/solutions/bench/effects";
export { Guide } from "@/lib/solutions/bench/Guide";
export { Ball, Box, Cyl, INK, Screw, Toon, tone } from "@/lib/solutions/bench/ink";
export { PartLabels, type PartLabel } from "@/lib/solutions/bench/PartLabels";
export { BenchCanvas, BookPage, useKeepDrawing, useRise, type BenchCanvasHandle, type BenchCanvasProps } from "@/lib/solutions/bench/Stage";
export { modelWithTune } from "@/lib/solutions/kits/types";
export { restTime } from "@/lib/solutions/viewer/payload";
export { AngleArc, DimensionLine, InkMaterial, PathLine, SceneLabel, VectorArrow, nightColor, paperColor, vectorColor, type SelectHandlers } from "@/lib/solutions/viewer/pieces";
export { useLab, type Phase, type Tab } from "@/lib/solutions/viewer/store";
export type { BenchProps, CameraPose, KitModel } from "@/lib/solutions/kits/types";
export type { ContributorCredit, Cue, Vec3 } from "@/lib/solutions/types";
