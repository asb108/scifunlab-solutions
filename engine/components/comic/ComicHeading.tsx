import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ComicHeadingProps {
  as?: "h1" | "h2" | "h3";
  srOnlySuffix?: string;
  className?: string;
  children: ReactNode;
}

export function ComicHeading({
  as: Heading = "h2",
  srOnlySuffix,
  className,
  children,
}: ComicHeadingProps) {
  const Element: ElementType = Heading;

  return (
    <Element className={cn("font-comic tracking-normal", className)}>
      {children}
      {srOnlySuffix ? <span className="sr-only"> {srOnlySuffix}</span> : null}
    </Element>
  );
}
