import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ComicPanelProps {
  className?: string;
  children: ReactNode;
}

export function ComicPanel({ className, children }: ComicPanelProps) {
  return (
    <div
      className={cn(
        "border-[3px] border-comic-ink bg-comic-paper text-comic-ink shadow-neo-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}
