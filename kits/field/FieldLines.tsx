"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { vectorColor, type Vec3 } from "@scifunlab/solution-sdk/bench";

import { traceFieldLine, type FieldModel } from "./model";

export function FieldLines({ model, opacity }: { model: FieldModel; opacity: number }) {
  const lines = useMemo(() => model.charges.filter((charge) => charge.q > 0).flatMap((charge) => {
    const center = model.toScene([charge.x, 0, 0]);
    return Array.from({ length: 16 }, (_, i) => {
      const plane = Math.floor(i / 4) * Math.PI / 4;
      const angle = (i % 4 + 0.5) * Math.PI / 2;
      const start: Vec3 = [
        center[0] + 0.4 * Math.cos(angle),
        0.4 * Math.sin(angle) * Math.cos(plane),
        0.4 * Math.sin(angle) * Math.sin(plane),
      ];
      return traceFieldLine(model, start);
    });
  }), [model]);

  if (opacity <= 0.01) return null;
  return (
    <group>
      {lines.filter((points) => points.length > 1).map((points, i) => (
        <Line key={i} points={points} color={vectorColor.field} lineWidth={2} transparent opacity={opacity} depthWrite={false} />
      ))}
    </group>
  );
}
