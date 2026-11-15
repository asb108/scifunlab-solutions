"use client";

/**
 * Colorfigures-style part labels. Desktop: cream pills in two columns down the
 * left and right edges of the figure, sorted by height so leaders never cross,
 * each with a 1 px ink leader to a dot on its part. Phones: a numbered badge
 * beside each dot (the caller lists the names under the figure).
 */
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import { Vector3 } from "three";

import type { Vec3 } from "@/lib/solutions/types";

import { INK, tone } from "./ink";

export interface PartLabel {
  id: string;
  text: string;
  at: Vec3;
  on: boolean;
}

const DOT = 6;
const EDGE = 10; // gap between a pill and the figure's side
const ROW = 26; // minimum vertical distance between pills in a column
const TOP = 40; // keep clear of the card's top corner text
const BOTTOM = 44; // and of the readout at the bottom
const CHAR_W = 6.8; // monospace 11 px capitals
const PILL_PAD = 16;

interface Placed {
  part: PartLabel;
  dot: [number, number];
  pill: [number, number]; // inner edge (where the leader meets the pill), vertical centre
  left: boolean;
}

/** Stack one column: keep each pill near its dot's height, at least ROW apart, inside [TOP, height - BOTTOM]. */
function stack(items: { y: number }[], height: number): number[] {
  const ys = items.map((it) => Math.min(height - BOTTOM, Math.max(TOP, it.y)));
  for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + ROW);
  const overflow = ys.length ? ys[ys.length - 1] - (height - BOTTOM) : 0;
  if (overflow > 0) {
    ys[ys.length - 1] -= overflow;
    for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - ROW);
  }
  return ys;
}

function layout(screen: { part: PartLabel; x: number; y: number }[], width: number, height: number): Placed[] {
  const placed: Placed[] = [];
  for (const left of [true, false]) {
    const column = screen.filter((s) => s.x < width / 2 === left).sort((a, b) => a.y - b.y);
    const ys = stack(column, height);
    column.forEach((s, i) => {
      const w = s.part.text.length * CHAR_W + PILL_PAD;
      placed.push({
        part: s.part,
        dot: [s.x, s.y],
        pill: [left ? EDGE + w : width - EDGE - w, ys[i]],
        left,
      });
    });
  }
  return placed;
}

function Columns({ parts }: { parts: PartLabel[] }) {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const invalidate = useThree((s) => s.invalidate);
  const [placed, setPlaced] = useState<Placed[]>([]);
  const v = useMemo(() => new Vector3(), []);
  const key = parts.map((p) => `${p.id}:${p.at.join(",")}:${p.on}`).join("|");

  useEffect(() => invalidate(), [key, invalidate]);

  // Runs on every rendered frame, i.e. only while the camera or the scene moves.
  useFrame(() => {
    const screen = parts.map((part) => {
      v.set(...part.at).project(camera);
      return { part, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height };
    });
    const next = layout(screen, size.width, size.height);
    const sig = next.map((p) => `${p.part.id}${p.part.on}${p.dot[0].toFixed(0)},${p.dot[1].toFixed(0)},${p.pill[1].toFixed(0)}`).join();
    setPlaced((prev) => {
      const prevSig = prev.map((p) => `${p.part.id}${p.part.on}${p.dot[0].toFixed(0)},${p.dot[1].toFixed(0)},${p.pill[1].toFixed(0)}`).join();
      return prevSig === sig ? prev : next;
    });
  });

  return (
    <Html calculatePosition={() => [0, 0]} zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
      <div aria-hidden="true" style={{ position: "relative", width: size.width, height: size.height }}>
        <svg
          width={size.width}
          height={size.height}
          style={{ position: "absolute", inset: 0, overflow: "visible", maxWidth: "none" }}
        >
          {placed.map((p) => (
            <g key={p.part.id}>
              <line x1={p.pill[0]} y1={p.pill[1]} x2={p.dot[0]} y2={p.dot[1]} stroke={INK} strokeWidth={1} />
              <circle cx={p.dot[0]} cy={p.dot[1]} r={DOT / 2} fill={INK} />
            </g>
          ))}
        </svg>
        {placed.map((p) => (
          <span
            key={p.part.id}
            className="absolute whitespace-nowrap border-2 border-comic-ink px-1.5 py-0.5 font-mono text-[11px] font-extrabold uppercase leading-none tracking-wide text-comic-ink shadow-neo-sm"
            style={{
              top: p.pill[1],
              left: p.left ? EDGE : undefined,
              right: p.left ? undefined : EDGE,
              transform: "translateY(-50%)",
              background: p.part.on ? tone.trim : "#FFF4D6",
            }}
          >
            {p.part.text}
          </span>
        ))}
      </div>
    </Html>
  );
}

function Badge({ index }: { index: number }) {
  return (
    <div style={{ position: "relative" }}>
      <span
        aria-hidden="true"
        style={{ position: "absolute", left: -DOT / 2, top: -DOT / 2, width: DOT, height: DOT, borderRadius: 9999, background: INK }}
      />
      <div style={{ position: "absolute", left: 6, top: -24 }}>
        <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-comic-ink bg-comic-paper font-mono text-[10px] font-black text-comic-ink shadow-neo-sm">
          {index + 1}
        </span>
      </div>
    </div>
  );
}

export function PartLabels({ parts, compact }: { parts: PartLabel[]; compact: boolean; centerX?: number }) {
  if (!compact) return <Columns parts={parts} />;
  return (
    <>
      {parts.map((part, i) => (
        <Html key={part.id} position={part.at} zIndexRange={[25, 0]} style={{ pointerEvents: "none" }}>
          <Badge index={i} />
        </Html>
      ))}
    </>
  );
}
