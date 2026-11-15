import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { TiltLabel } from "./TiltLabel";
import { tiltClass } from "./tilt";

export interface ComicPageHeroProps {
  label?: ReactNode;
  heading: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  detail?: boolean;
  className?: string;
  headingClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
}

/** Text-first section hero. Detail pages keep the body font for their LCP. */
export function ComicPageHero({
  label,
  heading,
  description,
  actions,
  children,
  detail = false,
  className,
  headingClassName,
  labelClassName,
  descriptionClassName,
}: ComicPageHeroProps) {
  return (
    <header className={cn("min-w-0 px-5 py-7 sm:p-8", className)}>
      {label ? (
        <TiltLabel tilt={-1} tone="ink" className={cn("max-w-full flex-wrap break-words [overflow-wrap:anywhere]", labelClassName)}>
          {label}
        </TiltLabel>
      ) : null}
      <h1 className={cn(
        "my-4 max-w-4xl break-words [overflow-wrap:anywhere] uppercase leading-tight",
        detail ? "font-sans text-3xl font-black sm:text-4xl md:text-6xl" : "font-comic text-4xl tracking-normal sm:text-5xl md:text-6xl",
        tiltClass(-1),
        headingClassName,
      )}>
        {heading}
      </h1>
      {description ? <p className={cn("max-w-3xl text-lg font-bold leading-relaxed", descriptionClassName)}>{description}</p> : null}
      {actions ? <div className="mt-6 flex flex-wrap items-center gap-4">{actions}</div> : null}
      {children}
    </header>
  );
}
