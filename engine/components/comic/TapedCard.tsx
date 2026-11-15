import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { tiltClass, type Tilt } from "./tilt";

export interface TapedCardProps {
  tilt?: Tilt;
  tint?: string;
  className?: string;
  children: ReactNode;
}

export function TapedCard({ tilt, tint, className, children }: TapedCardProps) {
  return (
    <div
      className={cn(
        "relative border-[3px] border-comic-ink shadow-neo",
        tint ?? "bg-comic-paper",
        tiltClass(tilt),
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute -left-3 -top-2 h-5 w-14 border border-comic-ink/20 bg-comic-yellow/80", tiltClass(-2))}
      />
      {children}
    </div>
  );
}
