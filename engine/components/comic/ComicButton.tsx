import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const VARIANT_CLASSES = {
  primary: "bg-comic-yellow text-comic-ink hover:bg-comic-green",
  secondary: "bg-comic-paper text-comic-ink hover:bg-comic-yellow",
} as const;

export interface ComicButtonProps {
  href: string;
  variant?: keyof typeof VARIANT_CLASSES;
  className?: string;
  children: ReactNode;
}

export function ComicButton({ href, variant = "primary", className, children }: ComicButtonProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-2 border-[3px] border-comic-ink px-5 py-3 font-sans text-sm font-bold uppercase tracking-wide shadow-neo transition-[transform,box-shadow] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-neo-sm motion-reduce:transform-none motion-reduce:transition-none",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}
