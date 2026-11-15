"use client";

/**
 * A tag that points down at the thing to touch. Unchanged from the
 * prototype's `Guide` (`app/solutions/prototype-bench/BenchScene.tsx`).
 */
import { Html } from "@react-three/drei";

import type { Vec3 } from "@/lib/solutions/types";

export function Guide({
  at,
  text,
  color,
  align = "center",
}: {
  at: Vec3;
  text: string;
  color: string;
  /** "left": the pointer sits under the chip's left end, so the chip reads clear of the frame's left edge. */
  align?: "center" | "left";
}) {
  return (
    <Html position={at} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
      <div style={{ transform: align === "left" ? "translate(-18px, -100%)" : "translate(-50%, -100%)" }}>
        <div className={`guide-bob flex flex-col ${align === "left" ? "items-start" : "items-center"}`}>
          <span
            className="whitespace-nowrap border-[3px] border-comic-ink px-2 py-1 text-xs font-black uppercase text-comic-ink shadow-neo-sm"
            style={{ background: color }}
          >
            {text}
          </span>
          <span
            className={`-mt-[7px] h-3 w-3 rotate-45 border-b-[3px] border-r-[3px] border-comic-ink ${align === "left" ? "ml-[12px]" : ""}`}
            style={{ background: color }}
          />
        </div>
      </div>
    </Html>
  );
}
