import { cn } from "@/lib/utils";

export interface StarburstProps {
  label: string;
  className?: string;
}

/** A spiky badge. The SVG is decorative; the label carries the meaning. */
export function Starburst({ label, className }: StarburstProps) {
  return (
    <span className={cn("relative inline-grid place-items-center", className)}>
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full fill-comic-yellow stroke-comic-ink stroke-2"
      >
        <polygon points="50,2 58,22 76,8 74,30 96,30 82,48 98,62 76,68 84,90 62,80 50,98 38,80 16,90 24,68 2,62 18,48 4,30 26,30 24,8 42,22" />
      </svg>
      <span
        role="img"
        aria-label={label}
        className="relative px-3 font-comic text-sm uppercase leading-none tracking-normal text-comic-ink"
      >
        {label}
      </span>
    </span>
  );
}
