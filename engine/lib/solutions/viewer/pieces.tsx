"use client";

import { Html, Line, Outlines } from "@react-three/drei";
import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";

import type { Vec3 } from "@/lib/solutions/types";

/** Fixed vector colours from the spec. */
export const vectorColor = {
  velocity: "#5B50FF",
  force: "#FF5050",
  acceleration: "#4ADE80",
  field: "#FFDE59",
} as const;

export const nightColor = "#14183A";
export const paperColor = "#FAF9F6";

const UP = new Vector3(0, 1, 0);

/** Comic body: flat toon shading with a black ink outline. */
export function InkMaterial({ color, opacity = 1 }: { color: string; opacity?: number }) {
  return <meshToonMaterial color={color} transparent={opacity < 1} opacity={opacity} />;
}

/** Pointer handlers from `useEmphasis().select(name)`, spread onto a group. */
export type SelectHandlers = {
  onClick?: (event: { stopPropagation(): void }) => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
};

export function VectorArrow({
  from,
  to,
  color,
  highlighted = false,
  opacity = 1,
  handlers,
}: {
  from: Vec3;
  to: Vec3;
  color: string;
  highlighted?: boolean;
  opacity?: number;
  handlers?: SelectHandlers;
}) {
  const { position, quaternion, shaft, head, radius } = useMemo(() => {
    const a = new Vector3(...from);
    const b = new Vector3(...to);
    const dir = b.clone().sub(a);
    const length = Math.max(dir.length(), 1e-4);
    const headLength = Math.min(0.42, length * 0.4);
    const q = new Quaternion().setFromUnitVectors(UP, dir.clone().normalize());
    return {
      position: a,
      quaternion: q,
      shaft: length - headLength,
      head: headLength,
      radius: highlighted ? 0.075 : 0.05,
    };
  }, [from, to, highlighted]);

  if (opacity <= 0.01) return null;
  const outline = highlighted ? 0.035 : 0.022;
  return (
    <group position={position} quaternion={quaternion} {...handlers}>
      <mesh position={[0, shaft / 2, 0]}>
        <cylinderGeometry args={[radius, radius, shaft, 12]} />
        <InkMaterial color={color} opacity={opacity} />
        <Outlines thickness={outline} color="black" transparent={opacity < 1} opacity={opacity} />
      </mesh>
      <mesh position={[0, shaft + head / 2, 0]}>
        <coneGeometry args={[radius * 2.6, head, 16]} />
        <InkMaterial color={color} opacity={opacity} />
        <Outlines thickness={outline} color="black" transparent={opacity < 1} opacity={opacity} />
      </mesh>
    </group>
  );
}

export function PathLine({ points, color = vectorColor.velocity, opacity = 1 }: { points: Vec3[]; color?: string; opacity?: number }) {
  if (points.length < 2 || opacity <= 0.01) return null;
  return (
    <Line
      points={points}
      color={color}
      lineWidth={3}
      dashed
      dashSize={0.18}
      gapSize={0.1}
      transparent
      opacity={opacity}
    />
  );
}

export function AngleArc({
  center,
  fromAngle,
  toAngle,
  radius = 1,
  color = paperColor,
  opacity = 1,
}: {
  center: Vec3;
  fromAngle: number;
  toAngle: number;
  radius?: number;
  color?: string;
  opacity?: number;
}) {
  const points = useMemo(() => {
    const n = 24;
    return Array.from({ length: n + 1 }, (_, i) => {
      const a = fromAngle + ((toAngle - fromAngle) * i) / n;
      return [center[0] + radius * Math.cos(a), center[1] + radius * Math.sin(a), center[2]] as Vec3;
    });
  }, [center, fromAngle, toAngle, radius]);
  if (opacity <= 0.01) return null;
  return <Line points={points} color={color} lineWidth={2} transparent opacity={opacity} />;
}

/** A measured distance: a line between a and b with end ticks. */
export function DimensionLine({ a, b, color = paperColor, opacity = 1 }: { a: Vec3; b: Vec3; color?: string; opacity?: number }) {
  const ticks = useMemo(() => {
    const d = new Vector3(b[0] - a[0], b[1] - a[1], 0).normalize();
    const n = new Vector3(-d.y, d.x, 0).multiplyScalar(0.18);
    const tick = (p: Vec3): Vec3[] => [
      [p[0] + n.x, p[1] + n.y, p[2]],
      [p[0] - n.x, p[1] - n.y, p[2]],
    ];
    return [tick(a), tick(b)];
  }, [a, b]);
  if (opacity <= 0.01) return null;
  return (
    <group>
      <Line points={[a, b]} color={color} lineWidth={2.5} transparent opacity={opacity} />
      <Line points={ticks[0]} color={color} lineWidth={2.5} transparent opacity={opacity} />
      <Line points={ticks[1]} color={color} lineWidth={2.5} transparent opacity={opacity} />
    </group>
  );
}

/** HTML chip over the scene, using the site's own fonts and server-rendered MathML. */
export function SceneLabel({ position, html, opacity = 1 }: { position: Vec3; html?: string; opacity?: number }) {
  if (!html || opacity <= 0.01) return null;
  return (
    <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none", opacity }}>
      <span
        className="math-inline whitespace-nowrap rounded border-2 border-comic-ink bg-comic-paper px-1.5 py-0.5 text-sm font-bold text-comic-ink shadow-neo-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </Html>
  );
}
