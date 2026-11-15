"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { Caveat } from "next/font/google";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { BoardLineHtml } from "@/lib/solutions/board";

const hand = Caveat({
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
  preload: false,
});

export const chalk = {
  white: "#F4F1E8",
  yellow: "#FFE58A",
  blue: "#A9C8FF",
  green: "#A8F0B8",
  pink: "#FFB3D1",
} as const;

const PX_PER_SECOND = 300;
const GAP = 0.22;

const MARK_PATHS = {
  circle:
    "M8,22 C6,8 40,2 62,4 C86,6 97,14 95,24 C93,35 60,39 36,37 C14,35 4,29 7,19 C9,12 20,8 30,7",
  box: "M4,6 C30,3 70,4 96,5 C97,16 96,28 95,36 C66,38 34,37 5,35 C4,25 3,15 5,4",
  underline: "M3,34 C25,30 50,37 74,32 C84,30 92,33 97,31",
} as const;

const TICK_PATH = "M4,16 C9,19 12,23 15,27 C21,16 29,8 37,3";

function timings(widths: number[]) {
  let t = 0.15;
  return widths.map((w) => {
    const duration = Math.max(0.4, w / PX_PER_SECOND);
    const start = t;
    t += duration + GAP;
    return { start, duration, end: start + duration };
  });
}

type OverlayMark = {
  kind: keyof typeof MARK_PATHS;
  left: number;
  top: number;
  width: number;
  height: number;
  color: keyof typeof chalk;
  end: number;
};

function MarkOverlays({
  lineRef,
  lineEnd,
  instant,
  color,
}: {
  lineRef: React.RefObject<HTMLDivElement | null>;
  lineEnd: number;
  instant: boolean;
  color: keyof typeof chalk;
}) {
  const [marks, setMarks] = useState<OverlayMark[]>([]);
  const [ticks, setTicks] = useState<{ left: number; top: number; width: number; height: number; end: number }[]>([]);

  useLayoutEffect(() => {
    const root = lineRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const nextMarks: OverlayMark[] = [];
    root.querySelectorAll(".board-mark").forEach((el) => {
      const mark = el as HTMLElement;
      const kind = (mark.dataset.mark ?? "circle") as keyof typeof MARK_PATHS;
      const r = mark.getBoundingClientRect();
      nextMarks.push({
        kind,
        left: r.left - box.left - 10,
        top: r.top - box.top - 6,
        width: r.width + 30,
        height: r.height + 12,
        color,
        end: lineEnd,
      });
    });
    const nextTicks: typeof ticks = [];
    root.querySelectorAll(".board-tick").forEach((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      nextTicks.push({ left: r.left - box.left, top: r.top - box.top, width: r.width || 36, height: r.height || 28, end: lineEnd });
    });
    setMarks(nextMarks);
    setTicks(nextTicks);
  }, [lineRef, lineEnd, color, instant]);

  // Remount each path when its line's end time changes: a path mounted with a stale (infinite) delay never animates.
  if (!instant && !Number.isFinite(lineEnd)) return null;

  return (
    <>
      {marks.map((m, i) => (
        <svg
          key={`m-${i}`}
          aria-hidden="true"
          className="pointer-events-none absolute overflow-visible"
          style={{ left: m.left, top: m.top, width: m.width, height: m.height, maxWidth: "none" }}
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
        >
          <motion.path
            key={`${m.end}-${instant}`}
            d={MARK_PATHS[m.kind]}
            fill="none"
            stroke={chalk[m.color]}
            strokeWidth={2.4}
            strokeLinecap="round"
            initial={{ pathLength: instant ? 1 : 0, opacity: instant ? 1 : 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: instant ? 0 : 0.6, delay: instant ? 0 : m.end + 0.1, ease: "easeInOut" }}
            style={{ filter: `drop-shadow(0 0 2px ${chalk[m.color]})` }}
          />
        </svg>
      ))}
      {ticks.map((t, i) => (
        <svg
          key={`t-${i}`}
          aria-hidden="true"
          className="pointer-events-none absolute overflow-visible"
          style={{ left: t.left, top: t.top, width: t.width, height: t.height, maxWidth: "none" }}
          viewBox="0 0 40 30"
          preserveAspectRatio="none"
        >
          <motion.path
            key={`${t.end}-${instant}`}
            d={TICK_PATH}
            fill="none"
            stroke={chalk.green}
            strokeWidth={4}
            strokeLinecap="round"
            initial={{ pathLength: instant ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: instant ? 0 : 0.45, delay: instant ? 0 : t.end + 0.75, ease: "easeOut" }}
          />
        </svg>
      ))}
    </>
  );
}

function WrittenLine({
  line,
  start,
  duration,
  instant,
  measure,
  onLink,
}: {
  line: BoardLineHtml;
  start: number;
  duration: number;
  instant: boolean;
  measure(el: HTMLDivElement | null): void;
  onLink(obj: string): void;
}) {
  const progress = useMotionValue(instant ? 1 : 0);
  const lineWrap = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lineEnd = start + duration;

  useEffect(() => {
    if (instant) {
      progress.set(1);
      return;
    }
    progress.set(0);
    if (!Number.isFinite(start)) return;
    const controls = animate(progress, 1, {
      duration,
      delay: start,
      ease: [0.45, 0.05, 0.55, 0.95],
    });
    return () => controls.stop();
  }, [instant, start, duration, progress]);

  const edge = useTransform(progress, (p) => `${p * 100}%`);
  const mask = useTransform(progress, (p) =>
    p >= 1 ? "none" : `linear-gradient(90deg, #000 calc(${p * 100}% - 28px), transparent calc(${p * 100}% + 2px))`,
  );
  const tipOpacity = useTransform(progress, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);
  const color = chalk[line.color];
  const size = line.size === "lg" ? "text-[27px]" : line.size === "sm" ? "text-[19px]" : "text-[23px]";

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;
    const handler = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".scene-link");
      if (!btn?.dataset.obj) return;
      e.stopPropagation();
      onLink(btn.dataset.obj);
    };
    root.addEventListener("click", handler);
    return () => root.removeEventListener("click", handler);
  }, [onLink, line.html]);

  return (
    <div ref={lineWrap} className="relative w-fit max-w-full" aria-label={line.say}>
      <motion.div
        ref={(el) => {
          contentRef.current = el;
          measure(el);
        }}
        className={`${size} leading-snug`}
        style={{
          color,
          WebkitMaskImage: mask,
          maskImage: mask,
          textShadow: `0 0 1px ${color}, 0 0 6px rgba(255,255,255,0.12)`,
        }}
        dangerouslySetInnerHTML={{ __html: line.html }}
      />
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: edge,
          opacity: tipOpacity,
          background: color,
          boxShadow: `0 0 10px 3px ${color}`,
        }}
      />
      <MarkOverlays lineRef={contentRef} lineEnd={instant ? 0 : lineEnd} instant={instant} color={line.color === "white" ? "yellow" : line.color} />
    </div>
  );
}

export function Chalkboard({
  lines,
  stepKey,
  onLink,
}: {
  lines: BoardLineHtml[];
  stepKey: string;
  onLink(obj: string): void;
}) {
  const reduce = useReducedMotion();
  const [instant, setInstant] = useState(false);
  const [round, setRound] = useState(0);
  const last = useRef(stepKey);
  if (last.current !== stepKey) {
    last.current = stepKey;
    if (instant) setInstant(false);
  }
  const els = useRef<(HTMLDivElement | null)[]>([]);
  const [widths, setWidths] = useState<number[] | null>(null);
  useLayoutEffect(() => {
    setWidths(lines.map((_, i) => els.current[i]?.offsetWidth ?? 200));
  }, [lines, stepKey, round]);
  const t = widths ? timings(widths) : lines.map(() => ({ start: Infinity, duration: 1, end: Infinity }));
  const skip = reduce || instant;

  return (
    <div className="mt-3">
      <div className="border-[3px] border-comic-ink bg-[#B9804A] p-[7px] shadow-neo-sm">
        <div
          role="group"
          aria-label="Chalkboard working for this step. Tap to finish writing."
          onClick={(e) => {
            if ((e.target as HTMLElement).closest(".scene-link")) return;
            setInstant(true);
          }}
          className={`${hand.className} relative min-h-[190px] cursor-pointer overflow-hidden px-4 py-3`}
          style={{
            background:
              "radial-gradient(ellipse at 18% 25%, rgba(255,255,255,0.07), transparent 45%), radial-gradient(ellipse at 82% 72%, rgba(255,255,255,0.06), transparent 50%), radial-gradient(ellipse at 55% 110%, rgba(255,255,255,0.05), transparent 55%), #24473B",
            boxShadow: "inset 0 0 28px rgba(0,0,0,0.45)",
          }}
        >
          <div key={`${stepKey}-${round}`} className="space-y-2.5">
            {lines.map((line, i) => (
              <WrittenLine
                key={i}
                line={line}
                start={t[i].start}
                duration={t[i].duration}
                instant={skip}
                onLink={onLink}
                measure={(el) => {
                  els.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
        <div className="relative mt-[5px] h-3 border-t-2 border-[#7A5230] bg-[#A06C3C]">
          <span className="absolute -top-2 left-6 h-2 w-9 rounded-sm bg-[#F7F4EC] shadow-[1px_1px_0_#0B0E28]" />
          <span className="absolute -top-3 right-8 h-3 w-12 rounded-sm border-2 border-comic-ink bg-[#3A4A8C]">
            <span className="absolute inset-x-0 bottom-0 h-1 bg-[#E9E4D8]" />
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setInstant(false);
            setRound((n) => n + 1);
          }}
          className="font-mono text-xs font-black uppercase underline decoration-2 underline-offset-4"
        >
          ✎ Write it again
        </button>
      </div>
    </div>
  );
}
