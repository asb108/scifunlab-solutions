"use client";

/**
 * The projectile-on-a-slope lab bench: a spring launcher at the foot of a
 * slope, with a ruler, protractor, flag and tape, driven by `BenchProps`
 * instead of local state. Ported from the approved prototype
 * (`app/solutions/prototype-bench/BenchScene.tsx`, commit `416fc0d`), which
 * this replaces.
 */
import { Line, Outlines } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useReducer, useRef, useState, type MutableRefObject } from "react";
import type { Group, Mesh } from "three";

import {
  BenchCanvas,
  Box,
  Cyl,
  DashedPath,
  DialHandle,
  Ghosts,
  Guide,
  INK,
  modelWithTune,
  PartLabels,
  PathHandle,
  PressButton,
  restTime,
  Screw,
  Tape,
  tone,
  useKeepDrawing,
  useLab,
  useRise,
  ValueTag,
  VectorArrow,
  vectorColor,
  type BenchProps,
  type Cue,
  type PartLabel,
  type Phase,
  type Tab,
  type Vec3,
} from "@scifunlab/solution-sdk/bench";

import { projectileKit, type ProjectileModel } from "./model";

/** Degrees -> radians, for the (degree-valued) guess/tune UI. `model.theta`/`model.alpha` are already radians. */
const DEG = Math.PI / 180;

const BASE_TOP = -0.6;
const BALL_R = 0.14;
/** Flight plays at 55% speed so the eye can follow. */
const SLOW = 0.55;
const PLANK_START = 0.06;
const PLANK_END = 9.3;

/** Abstract kit object names (from `cue.highlight`/scene links) mapped onto this bench's physical parts. */
const HIGHLIGHT_MAP: Record<string, string[]> = {
  alpha: ["PROTRACTOR"],
  theta: ["ANGLE DIAL", "LAUNCHER"],
  ux: ["ANGLE DIAL", "LAUNCHER"],
  uy: ["ANGLE DIAL", "LAUNCHER"],
  range: ["RULER"],
  landing: ["RULER"],
};
/** Object -> kit focus name, for scene-link camera jumps (`store.focus`). */
const OBJECT_FOCUS: Record<string, string> = {
  u: "launch",
  ux: "launch",
  uy: "launch",
  axes: "launch",
  g: "peak",
  path: "peak",
  landing: "home",
  range: "home",
  ground: "home",
  slope: "home",
  ball: "home",
};

function slopeAxes(alpha: number) {
  const c = Math.cos(alpha);
  const s = Math.sin(alpha);
  return { along: [c, s] as const, normal: [-s, c] as const };
}

/** One ball radius above the foot of the slope, along its normal. */
function launchPoint(alpha: number): Vec3 {
  const { normal } = slopeAxes(alpha);
  return [normal[0] * BALL_R, normal[1] * BALL_R, 0];
}

function ballAt(m: ProjectileModel, t: number): Vec3 {
  const p0 = launchPoint(m.alpha);
  const { p } = m.at(t);
  return [p0[0] + p[0], p0[1] + p[1], p0[2] + p[2]];
}

function alongSlope(alpha: number, s: number, z = 0): Vec3 {
  return [s * Math.cos(alpha), s * Math.sin(alpha), z];
}

/* ------------------------------------------------------------------ base */

function BasePlate() {
  const ref = useRise(0);
  const x0 = -1.35;
  const x1 = 9.6;
  const zd = 1.15;
  const groove: [number, number, number][] = [
    [x0 + 0.16, BASE_TOP + 0.002, -zd + 0.16],
    [x1 - 0.16, BASE_TOP + 0.002, -zd + 0.16],
    [x1 - 0.16, BASE_TOP + 0.002, zd - 0.16],
    [x0 + 0.16, BASE_TOP + 0.002, zd - 0.16],
    [x0 + 0.16, BASE_TOP + 0.002, -zd + 0.16],
  ];
  const feet: [number, number][] = [
    [x0 + 0.35, -zd + 0.35],
    [x1 - 0.35, -zd + 0.35],
    [x0 + 0.35, zd - 0.35],
    [x1 - 0.35, zd - 0.35],
  ];
  return (
    <group ref={ref} position={[0, -0.9, 0]}>
      <group position={[0, 0.9, 0]}>
        {feet.map(([x, z]) => (
          <group key={`${x}${z}`}>
            <Cyl r={0.24} h={0.04} position={[x, -1.08, z]} color={tone.metal} />
            <Cyl r={0.16} h={0.16} position={[x, -0.98, z]} color={tone.structure} />
          </group>
        ))}
        <Box size={[x1 - x0, 0.3, zd * 2]} position={[(x0 + x1) / 2, BASE_TOP - 0.15, 0]} color={tone.base} />
        <Box size={[x1 - x0, 0.05, 0.06]} position={[(x0 + x1) / 2, BASE_TOP - 0.025, zd - 0.03]} color={tone.trim} />
        <Line points={groove} color={INK} lineWidth={1} transparent opacity={0.55} />
        <Box size={[x1 - x0 - 0.6, 0.012, 0.16]} position={[(x0 + x1) / 2, BASE_TOP + 0.006, zd - 0.2]} color={tone.ruler} />
        <Line
          points={Array.from({ length: 45 }, (_, i) => {
            const x = x0 + 0.4 + i * 0.25;
            const len = i % 4 === 0 ? 0.11 : 0.05;
            return [
              [x, BASE_TOP + 0.0125, zd - 0.12],
              [x, BASE_TOP + 0.0125, zd - 0.12 - len],
            ] as [number, number, number][];
          }).flat()}
          segments
          color={INK}
          lineWidth={1}
        />
        {feet.map(([x, z]) => (
          <Screw key={`s${x}${z}`} position={[x + (x < 0 ? 0.0 : 0), BASE_TOP + 0.01, z]} />
        ))}
        <Box size={[1.4, 0.03, 0.34]} position={[6.7, BASE_TOP + 0.015, 0.84]} color={tone.ruler} />
        {[0.42, 0.3, 0.36].map((len, i) => (
          <Line
            key={i}
            points={[
              [6.18, BASE_TOP + 0.032, 0.76 + i * 0.08],
              [6.18 + len * 2.2, BASE_TOP + 0.032, 0.76 + i * 0.08],
            ]}
            color={INK}
            lineWidth={1.1}
            transparent
            opacity={0.7}
          />
        ))}
        <Screw position={[6.08, BASE_TOP + 0.04, 0.84]} />
        <Screw position={[7.32, BASE_TOP + 0.04, 0.84]} />
      </group>
    </group>
  );
}

/* ----------------------------------------------------------------- slope */

function Ruler({ highlighted }: { highlighted: boolean }) {
  const ticks = useMemo(() => {
    const segments: [number, number, number][] = [];
    for (let s = 0.25; s <= 9.0 + 1e-6; s += 0.25) {
      const whole = Math.abs(s - Math.round(s)) < 1e-6;
      const half = Math.abs(s * 2 - Math.round(s * 2)) < 1e-6;
      const len = whole ? 0.17 : half ? 0.11 : 0.065;
      segments.push([s, 0.0155, 0.6], [s, 0.0155, 0.6 - len]);
    }
    return segments;
  }, []);
  return (
    <group>
      <Box
        size={[PLANK_END - PLANK_START - 0.2, 0.014, 0.27]}
        position={[(PLANK_START + PLANK_END - 0.2) / 2, 0.007, 0.465]}
        color={highlighted ? tone.lit : tone.ruler}
      />
      <Line points={ticks} segments color={INK} lineWidth={1.1} />
    </group>
  );
}

function Hinge({ z }: { z: number }) {
  return (
    <group>
      <Box size={[0.42, 0.03, 0.3]} position={[0.38, -0.175, z]} color={tone.metal} />
      <Cyl r={0.06} h={0.3} position={[0.38, -0.24, z]} rotation={[Math.PI / 2, 0, 0]} color={tone.metal} />
      <Cyl r={0.022} h={0.36} position={[0.38, -0.24, z]} rotation={[Math.PI / 2, 0, 0]} color={tone.brass} />
    </group>
  );
}

function Slope({ alpha, highlighted }: { alpha: number; highlighted: Set<string> }) {
  const ref = useRise(0.12);
  const { along, normal } = slopeAxes(alpha);
  const w = (s: number, n: number): [number, number] => [s * along[0] + n * normal[0], s * along[1] + n * normal[1]];
  const knuckle = w(0.38, -0.24);
  const bar = w(8.8, -0.3);
  const postH = bar[1] - BASE_TOP;
  return (
    <group ref={ref} position={[0, BASE_TOP, 0]}>
      <group position={[0, -BASE_TOP, 0]}>
        {[-0.5, 0.5].map((z) => (
          <Box
            key={z}
            size={[0.24, knuckle[1] - 0.06 - BASE_TOP, 0.26]}
            position={[knuckle[0], (knuckle[1] - 0.06 + BASE_TOP) / 2, z]}
            color={tone.teal}
          />
        ))}
        {[-0.62, 0.62].map((z) => (
          <group key={z}>
            <Box size={[0.38, 0.08, 0.38]} position={[bar[0], BASE_TOP + 0.04, z]} color={tone.metal} />
            <Box size={[0.16, postH, 0.16]} position={[bar[0], BASE_TOP + postH / 2, z]} color={tone.structure} />
            <Box size={[0.24, 0.16, 0.24]} position={[bar[0], BASE_TOP + postH * 0.62, z]} color={tone.metal} />
            <Cyl r={0.025} h={0.14} position={[bar[0] + 0.19, BASE_TOP + postH * 0.62, z]} rotation={[0, 0, Math.PI / 2]} color={tone.metal} />
            <Cyl
              r={0.07}
              h={0.06}
              segments={14}
              edgeThreshold={10}
              position={[bar[0] + 0.28, BASE_TOP + postH * 0.62, z]}
              rotation={[0, 0, Math.PI / 2]}
              color={tone.brass}
            />
          </group>
        ))}
        <Box size={[0.08, 0.08, 1.08]} position={[bar[0], BASE_TOP + 0.55, 0]} color={tone.structure} />

        <mesh position={[0, 0, -0.76]}>
          <ringGeometry args={[0.95, 1.22, 32, 1, -6 * DEG, 44 * DEG]} />
          <meshStandardMaterial color={highlighted.has("PROTRACTOR") ? tone.lit : tone.ruler} roughness={0.6} side={2} />
        </mesh>
        <Line
          points={Array.from({ length: 8 }, (_, i) => {
            const a = i * 5 * DEG;
            const len = i % 3 === 0 ? 0.16 : 0.08;
            return [
              [1.22 * Math.cos(a), 1.22 * Math.sin(a), -0.75],
              [(1.22 - len) * Math.cos(a), (1.22 - len) * Math.sin(a), -0.75],
            ] as [number, number, number][];
          }).flat()}
          segments
          color={INK}
          lineWidth={1.1}
        />
        <Box size={[0.06, 0.52, 0.04]} position={[1.09, BASE_TOP + 0.26, -0.78]} color={tone.metal} />

        <group rotation={[0, 0, alpha]}>
          <Box
            size={[PLANK_END - PLANK_START, 0.16, 1.3]}
            position={[(PLANK_START + PLANK_END) / 2, -0.08, 0]}
            color={tone.plank}
          />
          <Box size={[0.12, 0.2, 1.3]} position={[PLANK_END - 0.06, 0.1, 0]} color={tone.structure} />
          <Ruler highlighted={highlighted.has("RULER")} />
          <Hinge z={-0.5} />
          <Hinge z={0.5} />
          <Box size={[0.22, 0.14, 1.5]} position={[8.8, -0.23, 0]} color={tone.metal} />
          {[1.6, 4.6, 7.6].map((s) => (
            <Screw key={s} position={[s, 0.01, -0.5]} />
          ))}
        </group>
      </group>
    </group>
  );
}

/* -------------------------------------------------------------- launcher */

function Spring({ from, to }: { from: number; to: number }) {
  const points = useMemo(() => {
    const turns = 9;
    const n = turns * 16;
    return Array.from({ length: n + 1 }, (_, i) => {
      const k = i / n;
      const a = k * turns * Math.PI * 2;
      return [from + (to - from) * k, 0.075 * Math.cos(a), 0.075 * Math.sin(a)] as [number, number, number];
    });
  }, [from, to]);
  return <Line points={points} color={tone.brass} lineWidth={2.2} />;
}

/** `theta` is the bench's degree-valued display angle (book value or the live dial). */
function Launcher({ alpha, theta, plunger, highlighted }: { alpha: number; theta: number; plunger: number; highlighted: boolean }) {
  const ref = useRise(0.24);
  const p0 = launchPoint(alpha);
  const cheekTop = p0[1] + 0.13;
  const dialTicks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (20 + i * 5) * DEG;
        const len = i % 2 === 0 ? 0.07 : 0.04;
        return [
          [0.19 * Math.cos(a), 0.19 * Math.sin(a), 0.013],
          [(0.19 - len * 0.7) * Math.cos(a), (0.19 - len * 0.7) * Math.sin(a), 0.013],
        ] as [number, number, number][];
      }).flat(),
    [],
  );
  const disc = -0.5 + 0.06 + plunger * 0.38;
  return (
    <group ref={ref} position={[0, BASE_TOP, 0]}>
      <group position={[0, -BASE_TOP, 0]}>
        {[-0.79, 0.79].map((z) => (
          <group key={z}>
            <Box size={[0.42, 0.06, 0.3]} position={[p0[0], BASE_TOP + 0.03, z]} color={tone.metal} />
            <Box size={[0.16, cheekTop - BASE_TOP, 0.07]} position={[p0[0], (cheekTop + BASE_TOP) / 2, z]} color={tone.teal} />
            <Screw position={[p0[0] - 0.14, BASE_TOP + 0.065, z + 0.09]} />
            <Screw position={[p0[0] + 0.14, BASE_TOP + 0.065, z + 0.09]} />
          </group>
        ))}
        <Box size={[0.26, 0.16, 0.26]} position={[p0[0] - 0.75, BASE_TOP + 0.08, 0.92]} color={tone.teal} />
        <Cyl r={0.07} h={0.06} position={[p0[0] - 0.75, BASE_TOP + 0.19, 0.92]} color={tone.red} />
        {[-1, 1].map((side) => (
          <Cyl key={side} r={0.042} h={0.58} position={[p0[0], p0[1], side * 0.47]} rotation={[Math.PI / 2, 0, 0]} color={tone.metal} />
        ))}
        <group position={[p0[0], p0[1], 0.825]}>
          <Cyl r={0.2} h={0.02} rotation={[Math.PI / 2, 0, 0]} color={highlighted ? tone.lit : tone.ruler} />
          <Line points={dialTicks} segments color={INK} lineWidth={1} />
          <group rotation={[0, 0, theta * DEG]}>
            <Box size={[0.17, 0.016, 0.01]} position={[0.085, 0, 0.018]} color={tone.coral} line="none" />
          </group>
          <Cyl r={0.055} h={0.06} segments={18} edgeThreshold={10} position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]} color={tone.brass} />
        </group>
        <group position={p0} rotation={[0, 0, theta * DEG]}>
          <mesh position={[-0.02, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <torusGeometry args={[0.165, 0.026, 10, 32]} />
            <meshStandardMaterial color={tone.metal} roughness={0.4} />
          </mesh>
          <Cyl r={0.18} h={0.04} position={[-0.5, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={tone.metal} />
          {[90, 210, 330].map((a) => (
            <Cyl
              key={a}
              r={0.016}
              h={0.48}
              position={[-0.26, 0.15 * Math.cos(a * DEG), 0.15 * Math.sin(a * DEG)]}
              rotation={[0, 0, Math.PI / 2]}
              color={tone.structure}
            />
          ))}
          <Cyl r={0.02} h={disc + 0.5} position={[(disc - 0.5) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={tone.metal} />
          <Spring from={-0.48} to={disc - 0.02} />
          <Cyl r={0.12} h={0.03} position={[disc, 0, 0]} rotation={[0, 0, Math.PI / 2]} color={tone.brass} />
        </group>
      </group>
    </group>
  );
}

/** Re-renders only when the plunger moves a visible amount, so the spring doesn't thrash every frame. */
function LauncherLive({
  alpha,
  theta,
  plungerRef,
  register,
  highlighted,
}: {
  alpha: number;
  theta: number;
  plungerRef: MutableRefObject<number>;
  register: MutableRefObject<(k: number) => void>;
  highlighted: boolean;
}) {
  const [, force] = useReducer((n: number) => n + 1, 0);
  register.current = (k: number) => {
    if (Math.abs(k - plungerRef.current) > 0.02) {
      plungerRef.current = k;
      force();
    }
  };
  return <Launcher alpha={alpha} theta={theta} plunger={plungerRef.current} highlighted={highlighted} />;
}

/* ------------------------------------------------------------ flag, tape */

function Flag({ alpha, s, active }: { alpha: number; s: number; active: boolean }) {
  const ref = useRef<Group>(null);
  const shown = useRef(s);
  const [moving, setMoving] = useState(false);
  useKeepDrawing(moving);
  useFrame((_, dt) => {
    const prev = shown.current;
    shown.current += (s - shown.current) * Math.min(1, dt * 14);
    ref.current?.position.set(shown.current, 0, -0.32);
    const anim = Math.abs(shown.current - s) > 0.002;
    if (anim !== moving) setMoving(anim);
    if (Math.abs(prev - shown.current) > 1e-4 && !anim && moving) setMoving(false);
  });
  return (
    <group rotation={[0, 0, alpha]}>
      <group ref={ref}>
        <Box size={[0.04, 0.012, 1.0]} position={[0, 0.008, 0.3]} color={tone.violet} line="none" />
        <group rotation={[0, 0, -alpha]}>
          <Cyl r={0.1} h={0.04} position={[0, 0.02, 0]} color={tone.metal} />
          <Cyl r={0.022} h={1.05} position={[0, 0.52, 0]} color={tone.ruler} />
          <mesh position={[0.25, 0.9, 0]}>
            <boxGeometry args={[0.48, 0.3, 0.014]} />
            <meshBasicMaterial color={active ? tone.violet : "#9A90FF"} />
            <Outlines thickness={0.02} color={INK} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/* --------------------------------------------------------------- flight */

function FlightLayer({
  flightModel,
  phase,
  cue,
  firedAt,
  step,
  onLanded,
  setPlunger,
}: {
  flightModel: ProjectileModel;
  phase: Phase;
  cue: Cue | null;
  firedAt: number;
  step: number;
  onLanded(): void;
  setPlunger(k: number): void;
}) {
  const ball = useRef<Mesh>(null);
  const landedOnce = useRef(false);
  const ghosts = useMemo(
    () => Array.from({ length: 7 }, (_, i) => ballAt(flightModel, ((i + 1) * flightModel.times.tFlight) / 8)),
    [flightModel],
  );
  const path = useMemo(
    () => Array.from({ length: 61 }, (_, i) => ballAt(flightModel, (i * flightModel.times.tFlight) / 60)),
    [flightModel],
  );
  const restPose = useMemo(() => {
    const p0 = launchPoint(flightModel.alpha);
    // Cocked: the ball sits on the plunger disc, back inside the cage.
    const back = 0.5 - 0.06 - 0.03 - BALL_R;
    return [p0[0] - back * Math.cos(flightModel.theta), p0[1] - back * Math.sin(flightModel.theta), 0] as Vec3;
  }, [flightModel]);

  const [animating, setAnimating] = useState(false);
  useKeepDrawing(animating);

  useEffect(() => {
    landedOnce.current = false;
  }, [firedAt]);

  useFrame(() => {
    if (!ball.current) return;
    let p: Vec3;
    if (cue) {
      // Solve step: rest at the step's cue time, regardless of the Guess/What-if flight phase.
      setPlunger(1);
      p = ballAt(flightModel, restTime(flightModel, cue));
    } else if (phase === "ready") {
      setPlunger(0);
      p = restPose;
    } else if (phase === "flying") {
      const elapsed = (performance.now() - firedAt) / 1000;
      const kick = Math.min(1, elapsed / 0.09);
      setPlunger(kick);
      const t = Math.max(0, elapsed - 0.09) * SLOW;
      if (t >= flightModel.times.tFlight) {
        p = ballAt(flightModel, flightModel.times.tFlight);
        if (!landedOnce.current) {
          landedOnce.current = true;
          onLanded();
        }
      } else if (kick < 1) {
        const p0 = ballAt(flightModel, 0);
        p = [restPose[0] + (p0[0] - restPose[0]) * kick, restPose[1] + (p0[1] - restPose[1]) * kick, 0];
      } else {
        p = ballAt(flightModel, t);
      }
    } else {
      setPlunger(1);
      p = ballAt(flightModel, flightModel.times.tFlight);
    }
    ball.current.position.set(...p);
    const move = phase === "flying" && !cue;
    if (move !== animating) setAnimating(move);
  });

  const showPath = cue ? true : phase === "landed";
  const showGhosts = cue ? step >= 3 : phase === "landed";
  useEffect(() => {
    if (!cue && phase === "flying") setAnimating(true);
    if (!cue && phase === "landed") setAnimating(false);
  }, [cue, phase, firedAt]);

  return (
    <group>
      <mesh ref={ball} castShadow>
        <sphereGeometry args={[BALL_R, 24, 16]} />
        <meshStandardMaterial color={tone.ball} roughness={0.35} />
        <Outlines thickness={0.025} color={INK} />
      </mesh>
      {showPath ? <DashedPath points={path} color={tone.ball} /> : null}
      {showGhosts ? <Ghosts points={ghosts} r={BALL_R * 0.7} color={tone.ball} /> : null}
    </group>
  );
}

function StepVectors({ flightModel, step }: { flightModel: ProjectileModel; step: number }) {
  const { along, normal } = slopeAxes(flightModel.alpha);
  const p0 = ballAt(flightModel, 0);
  const add = (p: Vec3, d: readonly [number, number], k: number): Vec3 => [p[0] + d[0] * k, p[1] + d[1] * k, p[2]];
  const k = 0.2;
  const dir: [number, number] = [Math.cos(flightModel.theta), Math.sin(flightModel.theta)];
  const peak = ballAt(flightModel, flightModel.times.tFlight / 2);
  const gk = 0.15;
  const ux = projectileKit.outputs.ux(flightModel);
  const uy = projectileKit.outputs.uy(flightModel);
  const g = flightModel.g;
  const gx = projectileKit.outputs.gx(flightModel);
  const gy = projectileKit.outputs.gy(flightModel);
  return (
    <group>
      {step === 0 ? (
        <>
          <VectorArrow from={p0} to={add(p0, along, 2.4)} color={tone.violet} />
          <VectorArrow from={p0} to={add(p0, normal, 1.6)} color={tone.violet} />
          <ValueTag at={add(p0, along, 2.65)} text="x" />
          <ValueTag at={add(p0, normal, 1.85)} text="y" />
        </>
      ) : null}
      {step === 1 ? (
        <>
          <VectorArrow from={p0} to={add(p0, dir, flightModel.u * k)} color={vectorColor.velocity} highlighted />
          <VectorArrow from={p0} to={add(p0, along, ux * k)} color={vectorColor.velocity} opacity={0.85} />
          <VectorArrow from={p0} to={add(p0, normal, uy * k)} color={vectorColor.velocity} opacity={0.85} />
          <ValueTag at={add(p0, dir, flightModel.u * k + 0.3)} text={`u = ${flightModel.u} m/s`} />
          <ValueTag at={add(add(p0, along, ux * k + 0.15), normal, -0.3)} text={`uₓ = ${ux.toFixed(2)}`} />
          <ValueTag at={add(p0, normal, uy * k + 0.28)} text={`u_y = ${uy.toFixed(2)}`} />
        </>
      ) : null}
      {step === 2 ? (
        <>
          <VectorArrow from={peak} to={add(peak, [0, -1], g * gk)} color={vectorColor.acceleration} highlighted />
          <VectorArrow from={peak} to={add(peak, [-along[0], -along[1]], gx * gk)} color={vectorColor.acceleration} opacity={0.85} />
          <VectorArrow from={peak} to={add(peak, [-normal[0], -normal[1]], gy * gk)} color={vectorColor.acceleration} opacity={0.85} />
          <ValueTag at={[peak[0] - 0.3, peak[1] - g * gk + 0.05, 0]} text="g" />
          <ValueTag at={[peak[0] - 1.05, peak[1] + 0.05, 0]} text={`g sin α = ${gx.toFixed(2)}`} />
          <ValueTag at={add(add(peak, [-normal[0], -normal[1]], gy * gk * 0.6), along, 0.95)} text={`g cos α = ${gy.toFixed(2)}`} />
        </>
      ) : null}
    </group>
  );
}

/** Step (0-indexed) -> bench parts to highlight, when the step's cue has no `highlight` of its own. */
function fallbackHighlight(step: number): string[] {
  if (step === 0) return ["RULER", "PROTRACTOR"];
  if (step === 1) return ["LAUNCHER", "ANGLE DIAL"];
  return [];
}

function Controls3D({
  model,
  tab,
  phase,
  guessName,
  tuneName,
  guessValue,
  tuneValue,
  guessTouched,
  tuneTouched,
  onGuess,
  onTune,
  onFire,
}: {
  model: ProjectileModel;
  tab: Tab;
  phase: Phase;
  guessName: string | null;
  tuneName: string | null;
  guessValue: number;
  tuneValue: number | null;
  guessTouched: boolean;
  tuneTouched: boolean;
  onGuess(v: number): void;
  onTune(v: number): void;
  onFire(): void;
}) {
  const p0 = launchPoint(model.alpha);
  const { along, normal } = slopeAxes(model.alpha);
  const button: Vec3 = [p0[0] - 0.75, BASE_TOP + 0.19, 0.92];
  const dial: [number, number, number] = [p0[0], p0[1], 0.85];
  const canFire = phase === "ready" && tab !== "solve";
  const dialOn = phase === "ready" && tab === "whatif" && tuneName !== null;
  const flagTop: Vec3 = [guessValue * along[0] + normal[0] * 1.25, guessValue * along[1] + normal[1] * 1.25, -0.32];
  const guessDef = guessName ? projectileKit.guesses[guessName] : undefined;
  const [guessMin, guessMax] = guessDef ? guessDef.range(model) : [0.5, PLANK_END - 0.4];
  const tuneDef = tuneName ? projectileKit.tunables[tuneName] : undefined;

  return (
    <group>
      <group position={[0, BASE_TOP, 0]}>
        <group position={[0, -BASE_TOP, 0]}>
          <group rotation={[0, 0, model.alpha]}>
            <PathHandle
              from={PLANK_START}
              length={PLANK_END - PLANK_START}
              width={1.3}
              min={guessMin}
              max={guessMax}
              enabled={tab === "guess" && phase === "ready" && guessName !== null}
              onChange={onGuess}
            />
          </group>
        </group>
      </group>
      <PressButton
        position={button}
        size={[0.45, 0.4, 0.45]}
        enabled={canFire}
        onPress={onFire}
      />
      {tuneDef ? (
        <DialHandle
          position={dial}
          radius={0.36}
          value={tuneValue ?? tuneDef.min}
          min={tuneDef.min}
          max={tuneDef.max}
          step={tuneDef.step}
          perPx={0.3}
          enabled={dialOn}
          onChange={onTune}
        />
      ) : null}
      {tab === "guess" && phase === "ready" && !guessTouched ? <Guide at={flagTop} text="↔ Drag the flag" color="#C4B5FD" /> : null}
      {canFire && (tab === "whatif" || guessTouched) ? (
        <Guide at={[button[0], button[1] + 0.12, button[2]]} text="Press to fire!" color="#FFB3AE" align="left" />
      ) : null}
      {dialOn && !tuneTouched ? <Guide at={[dial[0], dial[1] + 0.24, dial[2]]} text="↕ Drag the dial" color={tone.trim} align="left" /> : null}
    </group>
  );
}

function BenchLabels({
  showLabels,
  parts,
  highlighted,
  tab,
  phase,
  cue,
}: {
  showLabels: boolean;
  parts: BenchProps["parts"];
  highlighted: Set<string>;
  tab: Tab;
  phase: Phase;
  cue: Cue | null;
}) {
  const [compact, setCompact] = useState(false);
  const width = useThree((s) => s.size.width);
  useEffect(() => setCompact(width < 600), [width]);
  if (!showLabels) return null;
  const labels: PartLabel[] = parts.map((part) => ({
    id: part.id,
    text: part.text,
    at: part.at,
    on: highlighted.has(part.id) || (part.id === "SPRING" && !cue && phase === "flying") || (part.id === "ANGLE DIAL" && tab === "whatif"),
  }));
  return <PartLabels parts={labels} compact={compact} />;
}

export default function ProjectileBench(props: BenchProps) {
  const model = props.model as ProjectileModel;
  const { store, cue, showLabels, guess: guessName, tune: tuneName, onHandle, onLost, view, page, focuses, parts } = props;

  const tab = useLab(store, (s) => s.tab);
  const phase = useLab(store, (s) => s.phase);
  const step = useLab(store, (s) => s.step);
  const guessValue = useLab(store, (s) => s.guess);
  const tuneValue = useLab(store, (s) => s.tune);
  const firedAt = useLab(store, (s) => s.firedAt);
  const firedTune = useLab(store, (s) => s.firedTune);
  const guessTouched = useLab(store, (s) => s.guessTouched);
  const tuneTouched = useLab(store, (s) => s.tuneTouched);
  const storeFocus = useLab(store, (s) => s.focus);

  // The flight always plays at the model's FIRED tune (book theta if none was fired on this tab).
  const flightTheta = tab === "whatif" && firedTune !== null ? firedTune : props.numbers.theta;
  const flightModel = useMemo(
    () => (flightTheta === props.numbers.theta ? model : (modelWithTune(projectileKit, props.numbers, undefined, "theta", flightTheta) as ProjectileModel)),
    [model, props.numbers, flightTheta],
  );
  // The dial's own live angle (shown even before firing), only free on What-if.
  const dialTheta = tab === "whatif" ? tuneValue ?? props.numbers.theta : props.numbers.theta;

  const plunger = useRef(0);
  const plungerState = useRef<(k: number) => void>(() => {});

  const highlighted = useMemo(() => {
    if (cue?.highlight?.length) {
      const set = new Set<string>();
      for (const name of cue.highlight) for (const part of HIGHLIGHT_MAP[name] ?? []) set.add(part);
      return set;
    }
    if (tab === "solve") return new Set(fallbackHighlight(step));
    return new Set<string>();
  }, [cue, tab, step]);

  const focusName = storeFocus ? OBJECT_FOCUS[storeFocus] ?? storeFocus : cue?.focus ?? "home";
  const focusPose = focuses[focusName] ?? focuses.home;

  const tapeShow = cue ? step === 4 : phase === "landed";
  const tapeFrom = alongSlope(model.alpha, PLANK_START, 0.22);
  const tapeTo = alongSlope(flightModel.alpha, flightModel.rangeAlongSlope, 0.22);
  const land = ballAt(flightModel, flightModel.times.tFlight);

  return (
    <BenchCanvas
      view={view}
      focus={focusPose}
      page={page}
      handleRef={onHandle}
      onLost={onLost}
      ariaLabel="Lab bench: a spring launcher at the foot of a 15 degree slope with a ruler along it"
    >
      <BasePlate />
      <Slope alpha={model.alpha} highlighted={highlighted} />
      <LauncherLive
        alpha={model.alpha}
        theta={dialTheta}
        plungerRef={plunger}
        register={plungerState}
        highlighted={highlighted.has("LAUNCHER") || highlighted.has("ANGLE DIAL")}
      />
      {tab === "guess" && guessName ? <Flag alpha={model.alpha} s={guessValue} active={phase === "ready"} /> : null}
      <FlightLayer
        flightModel={flightModel}
        phase={phase}
        cue={cue}
        firedAt={firedAt}
        step={step}
        onLanded={() => store.landed(firedAt)}
        setPlunger={(k) => plungerState.current(k)}
      />
      <Tape from={tapeFrom} to={tapeTo} show={tapeShow} />
      {cue ? <StepVectors flightModel={flightModel} step={step} /> : null}
      {tapeShow ? <ValueTag at={[land[0], land[1] + 0.55, 0]} text={`${flightModel.rangeAlongSlope.toFixed(2)} m`} tone="yellow" /> : null}
      <Controls3D
        model={model}
        tab={tab}
        phase={phase}
        guessName={guessName}
        tuneName={tuneName}
        guessValue={guessValue}
        tuneValue={tuneValue}
        guessTouched={guessTouched}
        tuneTouched={tuneTouched}
        onGuess={store.setGuess}
        onTune={store.setTune}
        onFire={() => store.fire()}
      />
      <BenchLabels showLabels={showLabels} parts={parts} highlighted={highlighted} tab={tab} phase={phase} cue={cue} />
    </BenchCanvas>
  );
}
