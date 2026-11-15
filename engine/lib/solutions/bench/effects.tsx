"use client";

/**
 * Small reusable scene effects: a dashed flight path, ghost positions at
 * equal times, a value chip, and a tape measure that grows between two
 * points. Extracted from the prototype's `FlightLayer`, `Tag`, `LandingLabel`
 * and `Tape` (`app/solutions/prototype-bench/BenchScene.tsx`).
 */
import { Html, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { Quaternion, Vector3 } from "three";

import type { Vec3 } from "@/lib/solutions/types";

import { Ball, Box, tone } from "./ink";
import { useKeepDrawing } from "./Stage";

const X_AXIS = new Vector3(1, 0, 0);

/** The flight's path once it has landed, dashed like a chalk line. */
export function DashedPath({ points, color }: { points: Vec3[]; color: string }) {
  if (points.length < 2) return null;
  return <Line points={points} color={color} lineWidth={2.6} dashed dashSize={0.16} gapSize={0.1} />;
}

/** Faint balls marking equal time steps along a flight. */
export function Ghosts({ points, r, color }: { points: Vec3[]; r: number; color: string }) {
  return (
    <>
      {points.map((p, i) => (
        <Ball key={i} r={r} position={p} color={color} opacity={0.35} />
      ))}
    </>
  );
}

/** A small HTML chip next to a vector or part. */
export function ValueTag({ at, text, tone: variant = "paper" }: { at: Vec3; text: string; tone?: "paper" | "yellow" }) {
  const className =
    variant === "yellow"
      ? "whitespace-nowrap border-2 border-comic-ink bg-comic-yellow px-2 py-0.5 font-mono text-sm font-black text-comic-ink shadow-neo-sm"
      : "whitespace-nowrap border-2 border-comic-ink bg-comic-paper px-1.5 py-0.5 font-mono text-xs font-black text-comic-ink shadow-neo-sm";
  return (
    <Html position={at} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <span className={className}>{text}</span>
    </Html>
  );
}

/**
 * A tape measure that grows from `from` to `to` (any direction), eased, with
 * a green strip and a brass case at the end.
 */
export function Tape({ from, to, show }: { from: Vec3; to: Vec3; show: boolean }) {
  const ref = useRef<Group>(null);
  const k = useRef(0);
  const [growing, setGrowing] = useState(false);
  useKeepDrawing(growing);

  const dir = useMemo(() => new Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2]), [from, to]);
  const length = Math.max(dir.length(), 1e-4);
  const quaternion = useMemo(() => new Quaternion().setFromUnitVectors(X_AXIS, dir.clone().normalize()), [dir]);

  useFrame((_, dt) => {
    const target = show ? 1 : 0;
    k.current += (target - k.current) * Math.min(1, dt * 4);
    if (ref.current) {
      ref.current.scale.set(Math.max(0.001, k.current), 1, 1);
      ref.current.visible = k.current > 0.01;
    }
    const stillMoving = Math.abs(k.current - target) > 0.002;
    if (stillMoving !== growing) setGrowing(stillMoving);
  });

  return (
    <group position={from} quaternion={quaternion}>
      <group ref={ref}>
        <Box size={[length, 0.01, 0.08]} position={[length / 2, 0.006, 0]} color={tone.tape} />
        <Box size={[0.22, 0.17, 0.22]} position={[length + 0.11, 0.085, 0]} color={tone.brass} />
      </group>
    </group>
  );
}
