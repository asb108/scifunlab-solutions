"use client";

/**
 * Comic-ink parts shared by every lab bench. Flat "clay toy" shading plus a
 * dark ink line on every part: a silhouette (world-space `Outlines`, so the
 * line survives the orthographic camera) and, for boxes, a finer crease line
 * along internal edges.
 *
 * Extracted from `app/solutions/prototype-bench/ink.tsx`.
 */
import { Edges, Outlines } from "@react-three/drei";

export const INK = "#0B0E28";

/** Vivid toy colours (after lesson2play's pop-up pages), kept to the comic inks. */
export const tone = {
  base: "#6FA8FF", // sky-blue base plate
  trim: "#FFDE59", // yellow trim along the base
  structure: "#FF5A5F", // coral-red posts, rods
  teal: "#2EC4B6", // launcher uprights, hinge blocks
  plank: "#FFC93C", // sunflower slope
  metal: "#EEF2FC", // white steel collars, feet, cage
  brass: "#FFB627",
  ruler: "#FFFDF5",
  lit: "#5EF2C8", // mint highlight for the part a step is about
  ball: "#FF2E88", // the subject: magenta
  tape: "#22D37A",
  coral: "#FF5A5F",
  red: "#FF3B30",
  violet: "#8B5CF6",
  page: "#FFF6E3",
  pageLine: "#D9CDB0",
  board: "#2C55E0",
} as const;

/** A silhouette line's world-space thickness. Screen-space `Outlines` break under the orthographic camera. */
const SILHOUETTE = 0.028;
/** A crease line's width, in the units `Edges`/`Line` take (not world space). */
const CREASE_WIDTH = 0.9;

export function Toon({ color, opacity = 1 }: { color: string; opacity?: number }) {
  // Soft "clay toy" shading; the ink lines keep it comic.
  return <meshStandardMaterial color={color} roughness={0.58} metalness={0} transparent={opacity < 1} opacity={opacity} />;
}

type MeshBits = {
  position?: [number, number, number];
  rotation?: [number, number, number];
  color: string;
  opacity?: number;
  /** "none" draws no ink line at all. "edges"/"both" add a crease line (boxes only, via `Lines`). */
  line?: "edges" | "outline" | "both" | "none";
  edgeThreshold?: number;
};

function Lines({ line, threshold, opacity, crease }: { line: MeshBits["line"]; threshold: number; opacity: number; crease: boolean }) {
  if (line === "none" || opacity < 0.05) return null;
  return (
    <>
      <Outlines thickness={SILHOUETTE} color={INK} transparent={opacity < 1} opacity={opacity} />
      {crease && (line === "edges" || line === "both") ? (
        <Edges threshold={threshold} color={INK} lineWidth={CREASE_WIDTH} transparent={opacity < 1} opacity={opacity} />
      ) : null}
    </>
  );
}

export function Box({ size, position, rotation, color, opacity = 1, line = "edges", edgeThreshold = 20 }: MeshBits & { size: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Toon color={color} opacity={opacity} />
      <Lines line={line} threshold={edgeThreshold} opacity={opacity} crease />
    </mesh>
  );
}

/** A cylinder along local y. Few segments plus a low threshold draws a knurl. */
export function Cyl({
  r,
  rTop,
  h,
  position,
  rotation,
  color,
  opacity = 1,
  segments = 32,
  line = "both",
  edgeThreshold = 30,
}: MeshBits & { r: number; rTop?: number; h: number; segments?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[rTop ?? r, r, h, segments]} />
      <Toon color={color} opacity={opacity} />
      <Lines line={line} threshold={edgeThreshold} opacity={opacity} crease />
    </mesh>
  );
}

export function Ball({ r, position, color, opacity = 1 }: { r: number; position: [number, number, number]; color: string; opacity?: number }) {
  return (
    <mesh position={position} castShadow={opacity > 0.9}>
      <sphereGeometry args={[r, 24, 16]} />
      <Toon color={color} opacity={opacity} />
      {opacity > 0.05 ? <Outlines thickness={SILHOUETTE} color={INK} transparent={opacity < 1} opacity={opacity} /> : null}
    </mesh>
  );
}

/** A screw head: a flat disc with a slot line. */
export function Screw({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <Cyl r={0.05} h={0.02} color={tone.metal} segments={16} line="both" />
      <Box size={[0.07, 0.024, 0.01]} position={[0, 0.002, 0]} color={INK} line="none" />
    </group>
  );
}
