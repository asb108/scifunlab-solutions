import { cn } from "@/lib/utils";

/** The only rotations the design system allows. */
export type Tilt = -2 | -1 | 1 | 2;

const TILT_CLASSES: Record<Tilt, string> = {
  [-2]: "rotate-[-2deg]",
  [-1]: "rotate-[-1deg]",
  1: "rotate-[1deg]",
  2: "rotate-[2deg]",
};

/** Kept literal so Tailwind's scanner sees every rotation. */
const REDUCED_MOTION_CLASS = "motion-reduce:rotate-0";

export function tiltClass(tilt?: Tilt): string {
  if (tilt === undefined) return "";
  return cn(TILT_CLASSES[tilt], REDUCED_MOTION_CLASS);
}
