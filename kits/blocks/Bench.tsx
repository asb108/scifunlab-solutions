"use client";

/**
 * The blocks-on-a-pulley lab bench: an incline plank on a hinge, a spoked
 * pulley on an axle bracket at its top edge, a cord down to a hanging block
 * on a hook, a felt pad under the sliding block, a vertical ruler beside the
 * hanging block's drop, and a stopwatch on the base. Driven by `BenchProps`,
 * built from the shared pieces, following `kits/projectile/Bench.tsx`.
 *
 * The model auto-fits its whole layout to each given problem (so the Poster's
 * 2D view always frames neatly), which would make the physical bench itself
 * jump around if a What-if tune rebuilt the scene. Instead this bench reads
 * every *position* from the single, stable `props.model` (the book's given
 * values) and only ever borrows a *tuned* model's `a` to drive how far the
 * blocks travel (`flightPose`) -- the apparatus never moves, only the blocks.
 */
import { Line, Outlines } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";

import {
  BenchCanvas,
  Box,
  Cyl,
  DialHandle,
  Guide,
  INK,
  modelWithTune,
  PartLabels,
  PathHandle,
  PressButton,
  restTime,
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

import { blocksKit, pulleySpin, stringPoints, type BlocksModel } from "./model";

/** Flight plays at 55% speed so the eye can follow, same as the projectile kit. */
const SLOW = 0.55;
/** Gap below the lowest resting body point, where the base plate's top surface sits. */
const BASE_GAP = 0.08;
/** How far past B's column the ruler's rail stands (matches `model.parts.RULER`). */
const RULER_GAP = 0.56;

/** Abstract kit object names (from `cue.highlight`) mapped onto this bench's physical parts. */
const HIGHLIGHT_MAP: Record<string, string[]> = {
  fA: ["FELT PAD"],
};
/** Object -> kit focus name, for scene-link camera jumps (`store.focus`). */
const OBJECT_FOCUS: Record<string, string> = {
  incline: "home",
  pulley: "pulley",
  string: "pulley",
  blockA: "blockA",
  blockB: "pulley",
  N: "blockA",
  fA: "blockA",
  gA: "blockA",
  T_A: "blockA",
  T_B: "pulley",
  gB: "pulley",
  a: "home",
  fbdA: "blockA",
  fbdB: "pulley",
};

/** Step (0-indexed) -> bench parts to highlight, when the step's cue has no `highlight` of its own. */
function fallbackHighlight(step: number): string[] {
  if (step === 1) return ["FELT PAD"];
  if (step === 2) return ["BLOCK B"];
  return [];
}

/** The ramp's underside at its low (hinge) end: `lip` is the top surface's high end, `slopeLen`/`rampThick` away. */
function hingePivot(model: BlocksModel): Vec3 {
  return [
    model.lip[0] - model.upSlope[0] * model.slopeLen - model.normal[0] * model.rampThick,
    model.lip[1] - model.upSlope[1] * model.slopeLen - model.normal[1] * model.rampThick,
    0,
  ];
}

/** Metres along the ramp's own axis a world point sits from `rampCenter`. */
function alongOffset(model: BlocksModel, p: Vec3): number {
  return (p[0] - model.rampCenter[0]) * model.upSlope[0] + (p[1] - model.rampCenter[1]) * model.upSlope[1];
}

/** The base plate's top surface, in this (stable) model. */
function baseTopOf(model: BlocksModel): number {
  return model.floorY - BASE_GAP;
}

/** Where the stopwatch sits: on the base, just in front of the ramp (matches `model.parts.STOPWATCH`). */
function stopwatchSpot(model: BlocksModel): Vec3 {
  return [model.rampCenter[0], baseTopOf(model), model.rampDepth / 2 + 0.38];
}

/** Where the ruler's rail stands, level with B's resting height (matches `model.parts.RULER`). */
function rulerSpot(model: BlocksModel): { x: number; z: number; zero: number } {
  const b0 = model.at(0).B;
  return { x: b0[0] + model.blockB / 2 + RULER_GAP, z: b0[2], zero: b0[1] };
}

/**
 * Where the blocks sit after `t` seconds of motion at acceleration `a`,
 * anchored to the *stable* model's own rest pose and axes -- never to a
 * tuned model's (possibly differently auto-fit) geometry. Matches the
 * model's own `at(t)` exactly when `a === model.a`.
 */
function flightPose(model: BlocksModel, a: number, t: number): { s: number; A: Vec3; B: Vec3 } {
  const tc = Math.min(Math.max(t, 0), 1);
  const s = 0.5 * a * tc * tc;
  const disp = model.scale * s;
  const rest = model.at(0);
  const A: Vec3 = [rest.A[0] + model.upSlope[0] * disp, rest.A[1] + model.upSlope[1] * disp, rest.A[2]];
  const B: Vec3 = [rest.B[0], rest.B[1] - disp, rest.B[2]];
  return { s, A, B };
}

/** Block B's rendered box: it grows/shrinks with mass (scaled height), hung from a fixed top (the hook never moves). */
function blockBVisual(model: BlocksModel, poseB: Vec3, m2: number): { center: Vec3; height: number } {
  const sizeScale = Math.sqrt(Math.max(0.15, m2 / model.m2));
  const height = model.blockB * sizeScale;
  const topY = poseB[1] + model.blockB / 2;
  return { center: [poseB[0], topY - height / 2, poseB[2]], height };
}

/* -------------------------------------------------------------------- base */

function BasePlate({ model }: { model: BlocksModel }) {
  const ref = useRise(0);
  const top = baseTopOf(model);
  const rulerX = rulerSpot(model).x;
  const x0 = model.frame.minX - 0.9;
  const x1 = Math.max(model.frame.maxX, rulerX + 0.3) + 0.5;
  const zd = model.rampDepth / 2 + 0.6;
  const feet: [number, number][] = [
    [x0 + 0.35, -zd + 0.35],
    [x1 - 0.35, -zd + 0.35],
    [x0 + 0.35, zd - 0.35],
    [x1 - 0.35, zd - 0.35],
  ];
  return (
    <group ref={ref}>
      {feet.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl r={0.22} h={0.04} position={[x, top - 0.41, z]} color={tone.metal} />
          <Cyl r={0.14} h={0.15} position={[x, top - 0.335, z]} color={tone.structure} />
        </group>
      ))}
      <Box size={[x1 - x0, 0.26, zd * 2]} position={[(x0 + x1) / 2, top - 0.13, 0]} color={tone.base} />
      <Box size={[x1 - x0, 0.03, 0.05]} position={[(x0 + x1) / 2, top + 0.01, zd - 0.025]} color={tone.trim} />
    </group>
  );
}

/* --------------------------------------------------------------- the ramp */

function Hinge({ model }: { model: BlocksModel }) {
  const pivot = hingePivot(model);
  const top = baseTopOf(model);
  const postH = Math.max(0.3, pivot[1] - top);
  const midY = top + postH / 2;
  return (
    <group>
      {[-0.26, 0.26].map((z) => (
        <Box key={z} size={[0.2, postH, 0.18]} position={[pivot[0], midY, z]} color={tone.teal} />
      ))}
      <Cyl r={0.055} h={model.rampDepth * 0.95} position={pivot} rotation={[Math.PI / 2, 0, 0]} color={tone.brass} />
    </group>
  );
}

function PulleyBracket({ model, highlighted }: { model: BlocksModel; highlighted: boolean }) {
  const dx = model.pulley[0] - model.lip[0];
  const dy = model.pulley[1] - model.lip[1];
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(-dx, dy);
  const mid: Vec3 = [(model.lip[0] + model.pulley[0]) / 2, (model.lip[1] + model.pulley[1]) / 2, 0];
  const side = model.rampDepth / 2 + 0.07;
  return (
    <group>
      {[-side, side].map((z) => (
        <Box key={z} size={[0.1, len, 0.12]} position={[mid[0], mid[1], z]} rotation={[0, 0, ang]} color={highlighted ? tone.lit : tone.structure} />
      ))}
      <Box size={[0.18, 0.14, model.rampDepth + 0.14]} position={model.pulley} color={tone.metal} />
    </group>
  );
}

function FeltPad({ model }: { model: BlocksModel }) {
  const a0 = model.at(0).A;
  const a1 = model.at(1).A;
  const u0 = alongOffset(model, a0) - model.blockA.along / 2 - 0.08;
  const u1 = alongOffset(model, a1) + model.blockA.along / 2 + 0.08;
  const uMid = (u0 + u1) / 2;
  const len = Math.max(0.2, u1 - u0);
  const n = model.rampThick / 2 + 0.018;
  const center: Vec3 = [
    model.rampCenter[0] + model.upSlope[0] * uMid + model.normal[0] * n,
    model.rampCenter[1] + model.upSlope[1] * uMid + model.normal[1] * n,
    0,
  ];
  return <Box size={[len, 0.03, model.blockA.depth * 0.92]} position={center} rotation={[0, 0, model.alpha]} color={tone.teal} />;
}

function Ramp({ model, highlighted }: { model: BlocksModel; highlighted: { bracket: boolean } }) {
  const ref = useRise(0.08);
  return (
    <group ref={ref}>
      <Hinge model={model} />
      <Box size={[model.slopeLen, model.rampThick, model.rampDepth]} position={model.rampCenter} rotation={[0, 0, model.alpha]} color={tone.plank} />
      <FeltPad model={model} />
      <PulleyBracket model={model} highlighted={highlighted.bracket} />
    </group>
  );
}

/* ------------------------------------------------------------------ pulley */

function Pulley({ model, spin, highlighted }: { model: BlocksModel; spin: number; highlighted: boolean }) {
  const r = model.pulleyR;
  return (
    <group position={model.pulley}>
      <Cyl r={r} h={model.pulleyTube} segments={28} rotation={[Math.PI / 2, 0, 0]} color={highlighted ? tone.lit : tone.brass} />
      <group rotation={[0, 0, spin]}>
        <Box size={[r * 1.8, model.pulleyTube * 0.5, 0.026]} position={[0, 0, model.pulleyTube / 2 + 0.014]} color={tone.metal} line="none" />
        <Box size={[model.pulleyTube * 0.5, r * 1.8, 0.026]} position={[0, 0, model.pulleyTube / 2 + 0.014]} color={tone.metal} line="none" />
      </group>
      <Cyl r={model.pulleyTube * 0.42} h={model.rampDepth + 0.1} rotation={[Math.PI / 2, 0, 0]} color={tone.brass} />
    </group>
  );
}

function Cord({ model, A, B }: { model: BlocksModel; A: Vec3; B: Vec3 }) {
  const points = useMemo(() => stringPoints(model, A, B), [model, A, B]);
  return (
    <>
      <Line points={points} color={INK} lineWidth={5} />
      <Line points={points} color={tone.ruler} lineWidth={2} />
    </>
  );
}

/* ------------------------------------------------------------------ blocks */

function BlockA({ model, A, highlighted }: { model: BlocksModel; A: Vec3; highlighted: boolean }) {
  return <Box size={[model.blockA.along, model.blockA.thick, model.blockA.depth]} position={A} rotation={[0, 0, model.alpha]} color={highlighted ? tone.lit : tone.violet} />;
}

function BlockB({ model, B, m2, highlighted }: { model: BlocksModel; B: Vec3; m2: number; highlighted: boolean }) {
  const { center, height } = blockBVisual(model, B, m2);
  return (
    <group>
      <Box size={[model.blockB, height, model.blockB]} position={center} color={highlighted ? tone.lit : tone.coral} />
      <mesh position={[B[0], B[1] + model.blockB / 2, B[2]]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.07, 0.02, 8, 20, Math.PI * 1.5]} />
        <meshStandardMaterial color={tone.metal} roughness={0.4} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <Cyl r={0.075} h={0.05} rotation={[Math.PI / 2, 0, 0]} position={[center[0], center[1], center[2] + model.blockB / 2 + 0.03]} color={tone.brass} />
    </group>
  );
}

/* ------------------------------------------------------------------- ruler */

function Ruler({ model, highlighted }: { model: BlocksModel; highlighted: boolean }) {
  const { x, z, zero } = rulerSpot(model);
  const top = zero + 0.15;
  const bottom = zero - 2.6 * model.scale;
  const ticks = useMemo(() => {
    const segs: [number, number, number][] = [];
    for (let m2v = 0; m2v <= 2.5 + 1e-6; m2v += 0.25) {
      const y = zero - m2v * model.scale;
      const whole = Math.abs(m2v - Math.round(m2v)) < 1e-6;
      const len = whole ? 0.17 : 0.1;
      segs.push([x - 0.08, y, z + 0.15], [x - 0.08 - len, y, z + 0.15]);
    }
    return segs;
  }, [model.scale, x, z, zero]);
  return (
    <group>
      <Box size={[0.07, top - bottom, 0.07]} position={[x, (top + bottom) / 2, z]} color={highlighted ? tone.lit : tone.ruler} />
      <Line points={ticks} segments color={INK} lineWidth={1.2} />
    </group>
  );
}

/** The violet marker a student drags down the ruler to set the `dropIn1s` guess. */
function Marker({ model, value, active }: { model: BlocksModel; value: number; active: boolean }) {
  const { x, z, zero } = rulerSpot(model);
  const ref = useRef<Group>(null);
  const shown = useRef(zero - value * model.scale);
  const [moving, setMoving] = useState(false);
  useKeepDrawing(moving);
  useFrame((_, dt) => {
    const target = zero - value * model.scale;
    shown.current += (target - shown.current) * Math.min(1, dt * 14);
    ref.current?.position.set(x + 0.2, shown.current, z + 0.15);
    const anim = Math.abs(target - shown.current) > 0.002;
    if (anim !== moving) setMoving(anim);
  });
  return (
    <group ref={ref}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.09, 0.2, 3]} />
        <meshBasicMaterial color={active ? tone.violet : "#B6A9FF"} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- stopwatch */

function Stopwatch({ model, angle }: { model: BlocksModel; angle: number }) {
  const [cx, , cz] = stopwatchSpot(model);
  const top = baseTopOf(model);
  const standH = 0.14;
  const dialR = 0.24;
  const dialY = top + standH + dialR * 0.5;
  const ticks = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        const r1 = dialR - 0.09;
        const r2 = dialR - 0.045;
        return [
          [Math.cos(a) * r1, Math.sin(a) * r1, 0.042],
          [Math.cos(a) * r2, Math.sin(a) * r2, 0.042],
        ] as [number, number, number][];
      }).flat(),
    [],
  );
  return (
    <group position={[cx, top, cz]}>
      <Box size={[0.3, standH, 0.3]} position={[0, standH / 2, 0]} color={tone.metal} />
      <group position={[0, dialY - top, 0]}>
        <Cyl r={dialR} h={0.05} rotation={[Math.PI / 2, 0, 0]} color={tone.ruler} />
        <Cyl r={dialR - 0.045} h={0.012} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.032]} color={tone.page} />
        <Line points={ticks} segments color={INK} lineWidth={1.2} />
        <group rotation={[0, 0, angle]}>
          <Box size={[0.014, dialR - 0.08, 0.01]} position={[0, (dialR - 0.08) / 2, 0.05]} color={INK} line="none" />
        </group>
        <Cyl r={0.022} h={0.045} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.05]} color={tone.brass} />
      </group>
    </group>
  );
}

/* --------------------------------------------------------------- controls */

function Controls3D({
  model,
  tab,
  phase,
  guessName,
  tuneName,
  guessValue,
  tuneValue,
  m2Visual,
  poseB,
  guessTouched,
  tuneTouched,
  onGuess,
  onTune,
  onFire,
}: {
  model: BlocksModel;
  tab: Tab;
  phase: Phase;
  guessName: string | null;
  tuneName: string | null;
  guessValue: number;
  tuneValue: number | null;
  m2Visual: number;
  poseB: Vec3;
  guessTouched: boolean;
  tuneTouched: boolean;
  onGuess(v: number): void;
  onTune(v: number): void;
  onFire(): void;
}) {
  const { x: rulerX, z: rulerZ, zero } = rulerSpot(model);
  const guessDef = guessName ? blocksKit.guesses[guessName] : undefined;
  const [guessMin, guessMax] = guessDef ? guessDef.range(model) : [0, 2.5];
  const tuneDef = tuneName ? blocksKit.tunables[tuneName] : undefined;
  const canFire = phase === "ready" && tab !== "solve";
  const dialOn = phase === "ready" && tab === "whatif" && tuneName !== null;
  const buttonPos: Vec3 = [hingePivot(model)[0] + 0.55, baseTopOf(model) + 0.16, model.rampDepth / 2 + 0.42];
  const { center: knobCenter } = blockBVisual(model, poseB, m2Visual);
  const knobPos: Vec3 = [knobCenter[0], knobCenter[1], knobCenter[2] + model.blockB / 2 + 0.06];

  return (
    <group>
      <group position={[rulerX, zero, rulerZ]} rotation={[0, 0, -Math.PI / 2]}>
        <PathHandle
          from={guessMin * model.scale}
          length={(guessMax - guessMin) * model.scale}
          width={0.3}
          min={guessMin * model.scale}
          max={guessMax * model.scale}
          enabled={tab === "guess" && phase === "ready" && guessName !== null}
          onChange={(v) => onGuess(v / model.scale)}
        />
      </group>
      <PressButton position={buttonPos} size={[0.4, 0.35, 0.4]} enabled={canFire} onPress={onFire} />
      {tuneDef ? (
        <DialHandle
          position={knobPos}
          rotation={[Math.PI / 2, 0, 0]}
          radius={0.1}
          value={tuneValue ?? tuneDef.min}
          min={tuneDef.min}
          max={tuneDef.max}
          step={tuneDef.step}
          perPx={0.02}
          enabled={dialOn}
          onChange={onTune}
        />
      ) : null}
      {tab === "guess" && phase === "ready" && !guessTouched ? (
        <Guide at={[rulerX + 0.2, zero - (guessMin + (guessMax - guessMin) * 0.5) * model.scale, rulerZ]} text="↕ Drag the marker" color="#C4B5FD" />
      ) : null}
      {canFire && (tab === "whatif" || guessTouched) ? <Guide at={[buttonPos[0], buttonPos[1] + 0.14, buttonPos[2]]} text="Press to release!" color="#FFB3AE" align="left" /> : null}
      {dialOn && !tuneTouched ? <Guide at={[knobPos[0], knobPos[1] + 0.2, knobPos[2]]} text="↕ Turn the knob" color={tone.trim} align="left" /> : null}
    </group>
  );
}

/* ------------------------------------------------------------------- motion */

interface Motion {
  t: number;
  pose: { s: number; A: Vec3; B: Vec3 };
  animating: boolean;
}

function MotionDriver({
  model,
  flightA,
  phase,
  cue,
  firedAt,
  onLanded,
  onUpdate,
}: {
  model: BlocksModel;
  flightA: number;
  phase: Phase;
  cue: Cue | null;
  firedAt: number;
  onLanded(): void;
  onUpdate(m: Motion): void;
}) {
  const landedOnce = useRef(false);
  const [animating, setAnimating] = useState(false);
  useKeepDrawing(animating);

  useEffect(() => {
    landedOnce.current = false;
  }, [firedAt]);

  useFrame(() => {
    let t: number;
    let moving = false;
    if (cue) {
      t = restTime(model, cue);
    } else if (phase === "ready") {
      t = 0;
    } else if (phase === "flying") {
      const elapsed = (performance.now() - firedAt) / 1000;
      t = Math.min(1, elapsed * SLOW);
      moving = t < 1;
      if (t >= 1 && !landedOnce.current) {
        landedOnce.current = true;
        onLanded();
      }
    } else {
      t = 1;
    }
    onUpdate({ t, pose: flightPose(model, flightA, t), animating: moving });
    if (moving !== animating) setAnimating(moving);
  });

  return null;
}

/* --------------------------------------------------------------- vectors */

function StepVectors({ model, cue, pose }: { model: BlocksModel; cue: Cue; pose: { A: Vec3; B: Vec3 } }) {
  const show = new Set(cue.show);
  const highlight = new Set(cue.highlight ?? []);
  const add = (p: Vec3, d: Vec3): Vec3 => [p[0] + d[0], p[1] + d[1], p[2] + d[2]];
  const tagAt = (p: Vec3, d: Vec3, k = 1.14): Vec3 => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
  return (
    <group>
      {show.has("N") ? (
        <>
          <VectorArrow from={pose.A} to={add(pose.A, model.arrows.N)} color={vectorColor.force} />
          <ValueTag at={tagAt(pose.A, model.arrows.N)} text={`N = ${model.N.toFixed(2)} N`} />
        </>
      ) : null}
      {show.has("fA") ? (
        <>
          <VectorArrow from={pose.A} to={add(pose.A, model.arrows.fA)} color={vectorColor.force} highlighted={highlight.has("fA")} />
          <ValueTag at={tagAt(pose.A, model.arrows.fA, 1.4)} text={`f = ${model.f.toFixed(2)} N`} />
        </>
      ) : null}
      {show.has("gA") ? (
        <>
          <VectorArrow from={pose.A} to={add(pose.A, model.arrows.gA)} color={vectorColor.force} opacity={0.85} />
          <ValueTag at={tagAt(pose.A, model.arrows.gA)} text="m₁g" />
        </>
      ) : null}
      {show.has("T_A") ? <VectorArrow from={pose.A} to={add(pose.A, model.arrows.T_A)} color={vectorColor.force} opacity={0.85} /> : null}
      {show.has("T_B") ? (
        <>
          <VectorArrow from={pose.B} to={add(pose.B, model.arrows.T_B)} color={vectorColor.force} opacity={0.85} />
          <ValueTag at={tagAt(pose.B, model.arrows.T_B)} text={`T = ${model.T.toFixed(2)} N`} />
        </>
      ) : null}
      {show.has("gB") ? (
        <>
          <VectorArrow from={pose.B} to={add(pose.B, model.arrows.gB)} color={vectorColor.force} opacity={0.85} />
          <ValueTag at={tagAt(pose.B, model.arrows.gB)} text="m₂g" />
        </>
      ) : null}
      {show.has("a") ? (
        <>
          <VectorArrow from={pose.A} to={add(pose.A, model.arrows.aA)} color={vectorColor.acceleration} highlighted={highlight.has("a")} />
          <VectorArrow from={pose.B} to={add(pose.B, model.arrows.aB)} color={vectorColor.acceleration} highlighted={highlight.has("a")} />
          <ValueTag at={tagAt(pose.A, model.arrows.aA)} text={`a = ${model.a.toFixed(2)} m/s²`} />
        </>
      ) : null}
    </group>
  );
}

/* ----------------------------------------------------------------- labels */

function BenchLabels({
  showLabels,
  parts,
  highlighted,
}: {
  showLabels: boolean;
  parts: BenchProps["parts"];
  highlighted: Set<string>;
}) {
  const [compact, setCompact] = useState(false);
  const width = useThree((s) => s.size.width);
  useEffect(() => setCompact(width < 600), [width]);
  if (!showLabels) return null;
  const labels: PartLabel[] = parts.map((part) => ({ id: part.id, text: part.text, at: part.at, on: highlighted.has(part.id) }));
  return <PartLabels parts={labels} compact={compact} />;
}

/* --------------------------------------------------------------- the bench */

export default function BlocksBench(props: BenchProps) {
  const model = props.model as BlocksModel;
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

  // The flight always plays at the model's FIRED acceleration (the book's if none was fired on this tab);
  // only `a` is borrowed from a tuned model -- the bench's own geometry never changes.
  const flightA = useMemo(() => {
    if (tab === "whatif" && firedTune !== null) return (modelWithTune(blocksKit, props.numbers, undefined, "m2", firedTune) as BlocksModel).a;
    return model.a;
  }, [tab, firedTune, props.numbers, model]);
  // Block B's live size preview: the book's mass outside What-if, the dial's value while turning it, and
  // whatever was actually fired once a flight is under way.
  const m2Visual = tab === "whatif" ? (phase === "ready" ? (tuneValue ?? model.m2) : (firedTune ?? model.m2)) : model.m2;

  const [motion, setMotion] = useState<Motion>(() => ({ t: 0, pose: model.at(0), animating: false }));

  const highlighted = useMemo(() => {
    if (cue?.highlight?.length) {
      const set = new Set<string>();
      for (const name of cue.highlight) for (const part of HIGHLIGHT_MAP[name] ?? []) set.add(part);
      return set;
    }
    if (tab === "solve") return new Set(fallbackHighlight(step));
    return new Set<string>();
  }, [cue, tab, step]);

  const focusName = storeFocus ? (OBJECT_FOCUS[storeFocus] ?? storeFocus) : (cue?.focus ?? "home");
  const focusPose = focuses[focusName] ?? focuses.home;

  const tapeShow = cue ? step === 4 : phase === "landed";
  const ruler = rulerSpot(model);
  const spin = pulleySpin(model, motion.pose.s);
  const watchAngle = -Math.min(1, Math.max(0, motion.t)) * Math.PI * 2;

  return (
    <BenchCanvas
      view={view}
      focus={focusPose}
      page={page}
      handleRef={onHandle}
      onLost={onLost}
      ariaLabel="Lab bench: a violet block on a 30 degree incline, tied over a pulley to a hanging block"
    >
      <MotionDriver model={model} flightA={flightA} phase={phase} cue={cue} firedAt={firedAt} onLanded={() => store.landed(firedAt)} onUpdate={setMotion} />
      <BasePlate model={model} />
      <Ramp model={model} highlighted={{ bracket: highlighted.has("PULLEY") }} />
      <Pulley model={model} spin={spin} highlighted={highlighted.has("PULLEY")} />
      <Cord model={model} A={motion.pose.A} B={motion.pose.B} />
      <BlockA model={model} A={motion.pose.A} highlighted={highlighted.has("BLOCK A")} />
      <BlockB model={model} B={motion.pose.B} m2={m2Visual} highlighted={highlighted.has("BLOCK B")} />
      <Ruler model={model} highlighted={highlighted.has("RULER")} />
      <Stopwatch model={model} angle={watchAngle} />
      {tab === "guess" && guessName ? <Marker model={model} value={guessValue} active={phase === "ready"} /> : null}
      <Tape from={[ruler.x, ruler.zero, ruler.z]} to={[ruler.x, ruler.zero - motion.pose.s * model.scale, ruler.z]} show={tapeShow} />
      {tapeShow ? <ValueTag at={[ruler.x + 0.3, ruler.zero - motion.pose.s * model.scale, ruler.z]} text={`${motion.pose.s.toFixed(2)} m`} tone="yellow" /> : null}
      {cue ? <StepVectors model={model} cue={cue} pose={motion.pose} /> : null}
      <Controls3D
        model={model}
        tab={tab}
        phase={phase}
        guessName={guessName}
        tuneName={tuneName}
        guessValue={guessValue}
        tuneValue={tuneValue}
        m2Visual={m2Visual}
        poseB={motion.pose.B}
        guessTouched={guessTouched}
        tuneTouched={tuneTouched}
        onGuess={store.setGuess}
        onTune={store.setTune}
        onFire={() => store.fire()}
      />
      <BenchLabels showLabels={showLabels} parts={parts} highlighted={highlighted} />
    </BenchCanvas>
  );
}
