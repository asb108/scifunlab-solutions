import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface SpeechBubbleProps {
  children: ReactNode;
  className?: string;
}

export function SpeechBubble({ children, className }: SpeechBubbleProps) {
  return (
    <div
      className={cn(
        "relative inline-block border-[3px] border-comic-ink bg-comic-paper px-4 py-2 text-sm font-semibold text-comic-ink shadow-neo",
        "after:absolute after:-bottom-[11px] after:left-7 after:h-4 after:w-4 after:rotate-45 after:border-b-[3px] after:border-r-[3px] after:border-comic-ink after:bg-comic-paper",
        className,
      )}
    >
      {children}
    </div>
  );
}
