import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { tiltClass, type Tilt } from "./tilt";

const TONE_CLASSES = {
  yellow: "bg-comic-yellow text-comic-ink",
  violet: "bg-comic-violet text-comic-paper",
  coral: "bg-comic-coral text-comic-ink",
  green: "bg-comic-green text-comic-ink",
  ink: "bg-comic-ink text-comic-paper",
} as const;

export interface TiltLabelProps {
  tilt?: Tilt;
  tone?: keyof typeof TONE_CLASSES;
  className?: string;
  children: ReactNode;
}

export function TiltLabel({ tilt, tone = "yellow", className, children }: TiltLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border-2 border-comic-ink px-2 py-1 font-mono text-xs font-bold uppercase tracking-wide shadow-neo-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-0 group-hover:scale-105 motion-reduce:transition-none",
        TONE_CLASSES[tone],
        tiltClass(tilt),
        className,
      )}
    >
      {children}
    </span>
  );
}
