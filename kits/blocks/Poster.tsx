import { useId } from "react";

import type { KitPosterProps, Vec3 } from "@scifunlab/solution-sdk/kit";

import { blockAProfile, pulleySpin, rampProfile, stringPoints, type BlocksModel } from "./model";

const NIGHT = "#14183A";
const GRID = "#2A3070";
const PAPER = "#FAF9F6";
const VIOLET = "#5B50FF";
const CORAL = "#FF5050";
const GREEN = "#4ADE80";
const YELLOW = "#FFDE59";

const ARROWS = ["N", "fA", "gA", "T_A", "aA", "T_B", "gB", "aB"] as const;

/**
 * Server-rendered side view of one blocks step. It holds the viewport before
 * WebGL loads and is the picture when WebGL is missing.
 */
export function BlocksPoster({ model: rawModel, cue, t, width, height, describe }: KitPosterProps) {
  const m = rawModel as BlocksModel;
  const show = new Set(cue.show);
  const pose = m.at(Math.max(0, t));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const pad = 0.42;
  const minX = m.frame.minX - pad;
  const maxX = m.frame.maxX + pad;
  const minY = m.frame.minY - pad;
  const maxY = m.frame.maxY + pad;
  const worldW = Math.max(maxX - minX, 0.1);
  const worldH = Math.max(maxY - minY, 0.1);
  const k = Math.min(width / worldW, height / worldH);
  const ox = (width - worldW * k) / 2;
  const oy = (height - worldH * k) / 2;
  const px = (x: number) => ox + (x - minX) * k;
  const py = (y: number) => oy + (maxY - y) * k;
  const pts = (points: Vec3[]) => points.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`).join(" ");

  const body = (name: string) => {
    if (!show.has(name)) return 0;
    const dim = (show.has("fbdA") && name !== "blockA") || (show.has("fbdB") && name !== "blockB");
    return dim ? 0.25 : 1;
  };

  const inclineOp = body("incline");
  const pulleyOp = body("pulley");
  const stringOp = body("string");
  const blockAOp = body("blockA");
  const blockBOp = body("blockB");
  const string = stringPoints(m, pose.A, pose.B);
  const ang = pulleySpin(m, pose.s);
  const spoke = m.pulleyR * 0.82;
  const halfB = m.blockB / 2;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={describe} className="block h-full w-full">
      <defs>
        <pattern id={`${uid}-dots`} width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill={GRID} />
        </pattern>
        {[
          ["force", CORAL],
          ["accel", GREEN],
        ].map(([name, color]) => (
          <marker
            key={name}
            id={`${uid}-${name}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={color} stroke="#000" strokeWidth="1" />
          </marker>
        ))}
      </defs>
      <rect width={width} height={height} fill={NIGHT} />
      <rect width={width} height={height} fill={`url(#${uid}-dots)`} />

      {inclineOp > 0 ? (
        <polygon points={pts(rampProfile(m))} fill={PAPER} fillOpacity={inclineOp} stroke="#000" strokeOpacity={inclineOp} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {stringOp > 0 ? (
        <g opacity={stringOp}>
          <polyline points={pts(string)} fill="none" stroke="#000" strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" />
          <polyline points={pts(string)} fill="none" stroke={PAPER} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        </g>
      ) : null}
      {pulleyOp > 0 ? (
        <g opacity={pulleyOp}>
          <circle cx={px(m.pulley[0])} cy={py(m.pulley[1])} r={m.pulleyR * k} fill={YELLOW} stroke="#000" strokeWidth={3} />
          <line
            x1={px(m.pulley[0] + Math.cos(ang) * spoke)}
            y1={py(m.pulley[1] + Math.sin(ang) * spoke)}
            x2={px(m.pulley[0] - Math.cos(ang) * spoke)}
            y2={py(m.pulley[1] - Math.sin(ang) * spoke)}
            stroke={NIGHT}
            strokeWidth={4}
            strokeLinecap="round"
          />
        </g>
      ) : null}
      {blockAOp > 0 ? (
        <polygon points={pts(blockAProfile(m, pose.A))} fill={VIOLET} fillOpacity={blockAOp} stroke="#000" strokeOpacity={blockAOp} strokeWidth={3} strokeLinejoin="round" />
      ) : null}
      {blockBOp > 0 ? (
        <rect
          x={px(pose.B[0] - halfB)}
          y={py(pose.B[1] + halfB)}
          width={m.blockB * k}
          height={m.blockB * k}
          fill={CORAL}
          fillOpacity={blockBOp}
          stroke="#000"
          strokeOpacity={blockBOp}
          strokeWidth={3}
        />
      ) : null}
      {ARROWS.map((key) => {
        const cueName = key === "aA" || key === "aB" ? "a" : key;
        if (!show.has(cueName)) return null;
        const offset = m.arrows[key];
        if (Math.hypot(offset[0], offset[1]) < 0.04) return null;
        const origin = key.endsWith("B") || key === "T_B" || key === "gB" ? pose.B : pose.A;
        const color = cueName === "a" ? GREEN : CORAL;
        return (
          <line
            key={key}
            x1={px(origin[0])}
            y1={py(origin[1])}
            x2={px(origin[0] + offset[0])}
            y2={py(origin[1] + offset[1])}
            stroke={color}
            strokeWidth={4}
            strokeLinecap="round"
            markerEnd={`url(#${uid}-${cueName === "a" ? "accel" : "force"})`}
          />
        );
      })}
    </svg>
  );
}
