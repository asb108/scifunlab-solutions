"use client";

/**
 * The electric field lab bench: a pegboard with two charge pucks riding on
 * rails either side of a pivoted probe needle, built from the shared bench
 * pieces. New for the field kit (kit job: the field bench). Ported in spirit
 * from `projectile/Bench.tsx`, which this mirrors in structure.
 */
import { Line, Outlines } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";

import {
  Ball,
  BenchCanvas,
  Box,
  Cyl,
  DashedPath,
  DialHandle,
  Guide,
  INK,
  PartLabels,
  PathHandle,
  PressButton,
  restTime,
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
  type Vec3,
} from "@scifunlab/solution-sdk/bench";

import { FieldLines } from "./FieldLines";
import { electricField, fieldArrowTip, fieldKit, type FieldCharge, type FieldModel } from "./model";

const DEG = Math.PI / 180;

/** Index of the charge the `x2` tunable moves; the first charge's rail is fixed. */
const TUNE_INDEX = 1;

const PUCK_R = 0.42;
const PUCK_H = 0.24;
/** The puck's centre sits exactly on the physics plane (`model.toScene`'s y = 0); the rail and board sit below it. */
const RAIL_TOP = -PUCK_H / 2;
const RAIL_THICK = 0.1;
const BOARD_TOP = RAIL_TOP - RAIL_THICK;

const ARROW_LEN = 2.1;
const NEEDLE_LEN = 0.95;
/** The "Measure" animation's total length: E1 grows, then E2, then the sum, ~1.2s at the bench's pace. */
const MEASURE_MS = 1200;

const CORAL = "#FF5050";
const BLUE = "#3B82F6";
const FIELD_YELLOW = vectorColor.field; // #FFDE59, the true needle and E-vectors

type Vec2 = [number, number];

function angleOf([x, y]: Vec2): number {
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
}

function magnitudeOf([x, y]: Vec2): number {
  return Math.hypot(x, y) / 1e6;
}

/** Fields at `probe` for an arbitrary charges array, split out so the bench can read a live (dragged) reading. */
function fieldsAt(charges: FieldCharge[], probe: Vec2) {
  return {
    E1: electricField(charges.slice(0, 1), probe),
    E2: electricField(charges.slice(1, 2), probe),
    Enet: electricField(charges, probe),
  };
}

function chargePos(model: FieldModel, index: number, liveX?: number): Vec3 {
  const charge = model.charges[index];
  return model.toScene([liveX ?? charge.x, 0, 0]);
}

function probePos(model: FieldModel): Vec3 {
  return model.toScene([model.probe[0], model.probe[1], 0]);
}

/** `model.toScene`'s own inverse along x, using one known point rather than its private `minX`. */
function sceneXToMetres(model: FieldModel, sceneX: number): number {
  const ref = model.charges[0].x;
  const refScene = model.toScene([ref, 0, 0])[0];
  return ref + (sceneX - refScene) / model.scale;
}

/** Abstract kit object -> physical parts to highlight when a Solve step's cue asks for it. */
const HIGHLIGHT_MAP: Record<string, string[]> = {
  charges: ["CHARGE +", "CHARGE \u2212"],
  probe: ["PROBE", "NEEDLE"],
  fieldLines: ["PEGBOARD"],
};
/** Object -> kit focus name, for scene-link camera jumps (`store.focus`). */
const OBJECT_FOCUS: Record<string, string> = {
  charges: "home",
  fieldLines: "home",
  probe: "probe",
  E1: "probe",
  E2: "probe",
  Enet: "probe",
  testCharge: "probe",
  testPath: "probe",
};

/* ------------------------------------------------------------- pegboard */

function PegHoles({ x0, x1 }: { x0: number; x1: number }) {
  const holes = useMemo(() => {
    const pts: [number, number][] = [];
    for (let x = x0 + 0.5; x <= x1 - 0.5; x += 0.85) {
      for (const z of [-0.7, 0, 0.7]) pts.push([x, z]);
    }
    return pts;
  }, [x0, x1]);
  return (
    <>
      {holes.map(([x, z], i) => (
        <Cyl key={i} r={0.045} h={0.012} segments={8} position={[x, BOARD_TOP + 0.007, z]} color={INK} line="none" />
      ))}
    </>
  );
}

function Pegboard({ x0, x1, highlighted }: { x0: number; x1: number; highlighted: boolean }) {
  const ref = useRise(0);
  const z0 = -1.15;
  const z1 = 1.15;
  const feet: [number, number][] = [
    [x0 + 0.5, z0 + 0.35],
    [x1 - 0.5, z0 + 0.35],
    [x0 + 0.5, z1 - 0.35],
    [x1 - 0.5, z1 - 0.35],
  ];
  const plankTop = BOARD_TOP;
  const plankThick = 0.1;
  const slabTop = plankTop - plankThick;
  const slabThick = 0.3;
  const footTop = slabTop - slabThick;
  return (
    <group ref={ref}>
      {feet.map(([x, z]) => (
        <group key={`${x}${z}`}>
          <Cyl r={0.22} h={0.04} position={[x, footTop - 0.2, z]} color={tone.metal} />
          <Cyl r={0.14} h={0.18} position={[x, footTop - 0.09, z]} color={tone.structure} />
        </group>
      ))}
      <Box size={[x1 - x0, slabThick, z1 - z0]} position={[(x0 + x1) / 2, slabTop - slabThick / 2, 0]} color={tone.base} />
      <Box size={[x1 - x0 - 0.3, plankThick, z1 - z0 - 0.3]} position={[(x0 + x1) / 2, plankTop - plankThick / 2, 0]} color={highlighted ? tone.lit : tone.plank} />
      <PegHoles x0={x0 + 0.2} x1={x1 - 0.2} />
    </group>
  );
}

/* ------------------------------------------------------------------ rail */

function RailTrack({ from, to, highlighted }: { from: number; to: number; highlighted: boolean }) {
  const mid = (from + to) / 2;
  const len = Math.max(to - from, 0.6);
  const y = RAIL_TOP - RAIL_THICK / 2;
  return (
    <group>
      <Box size={[len, RAIL_THICK, 0.9]} position={[mid, y, 0]} color={highlighted ? tone.lit : tone.metal} />
      <Box size={[0.1, RAIL_THICK + 0.1, 0.92]} position={[mid - len / 2 - 0.04, y + 0.05, 0]} color={tone.structure} />
      <Box size={[0.1, RAIL_THICK + 0.1, 0.92]} position={[mid + len / 2 + 0.04, y + 0.05, 0]} color={tone.structure} />
    </group>
  );
}

function ScaleStrip({ from, to, highlighted }: { from: number; to: number; highlighted: boolean }) {
  const ticks = useMemo(() => {
    const segs: [number, number, number][] = [];
    let n = 0;
    for (let s = from; s <= to + 1e-6; s += 0.4) {
      const len = n % 2 === 0 ? 0.13 : 0.07;
      segs.push([s, RAIL_TOP + 0.006, 0.58], [s, RAIL_TOP + 0.006, 0.58 - len]);
      n += 1;
    }
    return segs;
  }, [from, to]);
  return (
    <group>
      <Box size={[to - from, 0.012, 0.22]} position={[(from + to) / 2, RAIL_TOP + 0.001, 0.69]} color={highlighted ? tone.lit : tone.ruler} />
      <Line points={ticks} segments color={INK} lineWidth={1.1} />
    </group>
  );
}

function ChargePuck({ position, q, highlighted }: { position: Vec3; q: number; highlighted: boolean }) {
  const color = highlighted ? tone.lit : q > 0 ? CORAL : BLUE;
  return (
    <group position={position}>
      <Cyl r={PUCK_R} h={PUCK_H} segments={28} color={color} />
      <Box size={[PUCK_R * 0.95, 0.018, 0.09]} position={[0, PUCK_H / 2 + 0.01, 0]} color={INK} line="none" />
      {q > 0 ? <Box size={[0.09, 0.018, PUCK_R * 0.95]} position={[0, PUCK_H / 2 + 0.01, 0]} color={INK} line="none" /> : null}
    </group>
  );
}

/* ---------------------------------------------------------------- probe */

function ProbeStand({ position, highlighted }: { position: Vec3; highlighted: boolean }) {
  const ref = useRise(0.18);
  const [x, y, z] = position;
  const footH = 0.16;
  const footTop = BOARD_TOP + footH;
  return (
    <group ref={ref}>
      <Cyl r={0.5} h={footH} position={[x, BOARD_TOP + footH / 2, z]} color={tone.metal} />
      <Cyl r={0.05} h={y - footTop} position={[x, (footTop + y) / 2, z]} color={highlighted ? tone.lit : tone.structure} />
      <Cyl r={0.12} h={0.06} segments={20} position={[x, y, z]} color={tone.brass} />
    </group>
  );
}

/** A thin pivoted arrow pointing along local +x before any rotation is applied. */
function NeedleArrow({ color, length }: { color: string; length: number }) {
  const headLen = 0.22;
  return (
    <group>
      <mesh position={[(length - headLen) / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <cylinderGeometry args={[0.032, 0.032, length - headLen, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
      <mesh position={[length - headLen / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.09, headLen, 12]} />
        <meshStandardMaterial color={color} roughness={0.5} />
        <Outlines thickness={0.02} color={INK} />
      </mesh>
    </group>
  );
}

/** The true-field needle, which swings smoothly to `target` (degrees) rather than snapping. */
function TrueNeedle({ position, target, length }: { position: Vec3; target: number; length: number }) {
  const ref = useRef<Group>(null);
  const shown = useRef(target);
  const [moving, setMoving] = useState(false);
  useKeepDrawing(moving);
  useFrame((_, dt) => {
    const diff = ((target - shown.current + 540) % 360) - 180;
    const active = Math.abs(diff) > 0.05;
    shown.current += diff * Math.min(1, dt * 6);
    ref.current?.rotation.set(0, 0, shown.current * DEG);
    if (active !== moving) setMoving(active);
  });
  return (
    <group position={position} ref={ref}>
      <NeedleArrow color={FIELD_YELLOW} length={length} />
    </group>
  );
}

/* --------------------------------------------------------------- vectors */

function SolveVectors({ model, probeScene, cue }: { model: FieldModel; probeScene: Vec3; cue: Cue }) {
  const show = new Set(cue.show);
  const hl = new Set(cue.highlight ?? []);
  return (
    <group>
      {show.has("E1") ? (
        <>
          <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, model.probeE.E1, ARROW_LEN)} color={FIELD_YELLOW} highlighted={hl.has("E1")} />
          <ValueTag at={fieldArrowTip(probeScene, model.probeE.E1, ARROW_LEN + 0.35)} text="E1" />
        </>
      ) : null}
      {show.has("E2") ? (
        <>
          <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, model.probeE.E2, ARROW_LEN)} color={FIELD_YELLOW} highlighted={hl.has("E2")} />
          <ValueTag at={fieldArrowTip(probeScene, model.probeE.E2, ARROW_LEN + 0.35)} text="E2" />
        </>
      ) : null}
      {show.has("Enet") ? (
        <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, model.probeE.Enet, ARROW_LEN * 1.15)} color={FIELD_YELLOW} highlighted={hl.has("Enet")} />
      ) : null}
    </group>
  );
}

/** Guess/What-if's "Measure": E1 then E2 then their sum grow from the probe, over `MEASURE_MS`. */
function MeasureLayer({
  probeScene,
  fields,
  phase,
  firedAt,
  onLanded,
}: {
  probeScene: Vec3;
  fields: { E1: Vec2; E2: Vec2; Enet: Vec2 };
  phase: Phase;
  firedAt: number;
  onLanded(): void;
}) {
  const landedOnce = useRef(false);
  const [elapsed, setElapsed] = useState(0);
  const animating = phase === "flying";
  useKeepDrawing(animating);

  useEffect(() => {
    landedOnce.current = false;
  }, [firedAt]);

  useFrame(() => {
    if (!animating) return;
    const e = performance.now() - firedAt;
    setElapsed(e);
    if (e >= MEASURE_MS && !landedOnce.current) {
      landedOnce.current = true;
      onLanded();
    }
  });

  const shown = phase === "landed" ? MEASURE_MS : phase === "flying" ? elapsed : 0;
  const f1 = Math.min(1, shown / 400);
  const f2 = Math.min(1, Math.max(0, (shown - 400) / 400));
  const f3 = Math.min(1, Math.max(0, (shown - 800) / 400));

  return (
    <group>
      {f1 > 0.01 ? (
        <>
          <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, fields.E1, ARROW_LEN * f1)} color={FIELD_YELLOW} />
          {f1 > 0.6 ? <ValueTag at={fieldArrowTip(probeScene, fields.E1, ARROW_LEN + 0.35)} text="E1" /> : null}
        </>
      ) : null}
      {f2 > 0.01 ? (
        <>
          <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, fields.E2, ARROW_LEN * f2)} color={FIELD_YELLOW} />
          {f2 > 0.6 ? <ValueTag at={fieldArrowTip(probeScene, fields.E2, ARROW_LEN + 0.35)} text="E2" /> : null}
        </>
      ) : null}
      {f3 > 0.01 ? <VectorArrow from={probeScene} to={fieldArrowTip(probeScene, fields.Enet, ARROW_LEN * 1.15 * f3)} color={FIELD_YELLOW} highlighted /> : null}
    </group>
  );
}

/* --------------------------------------------------------------- labels */

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

/* ------------------------------------------------------------------ main */

export default function FieldBench(props: BenchProps) {
  const model = props.model as FieldModel;
  const { store, cue, showLabels, guess: guessName, tune: tuneName, onHandle, onLost, view, page, focuses, parts } = props;
  const guessDef = fieldKit.guesses[guessName ?? "direction"];
  const tuneDef = fieldKit.tunables[tuneName ?? "x2"];

  const tab = useLab(store, (s) => s.tab);
  const phase = useLab(store, (s) => s.phase);
  const guessValue = useLab(store, (s) => s.guess);
  const tuneValue = useLab(store, (s) => s.tune);
  const firedAt = useLab(store, (s) => s.firedAt);
  const firedTune = useLab(store, (s) => s.firedTune);
  const guessTouched = useLab(store, (s) => s.guessTouched);
  const storeFocus = useLab(store, (s) => s.focus);

  const bookX2 = (model.charges[TUNE_INDEX] ?? model.charges[0]).x;
  const probeScene = probePos(model);
  const plusScene = chargePos(model, 0);

  // The live (dragged) reading, for the needle and tag that "follow the live model" in What-if, independent of firing.
  const liveX2 = tab === "whatif" ? tuneValue ?? bookX2 : bookX2;
  const liveCharges = useMemo(
    () => model.charges.map((c, i) => (i === TUNE_INDEX ? { ...c, x: liveX2 } : c)),
    [model.charges, liveX2],
  );
  const liveFields = useMemo(() => fieldsAt(liveCharges, model.probe), [liveCharges, model.probe]);
  const minusScene = chargePos(model, TUNE_INDEX, liveX2);

  // The field a "Measure" fire reads: the book charges in Guess/Solve, or the tune in play when the student last fired.
  const flightX2 = tab === "whatif" && firedTune !== null ? firedTune : bookX2;
  const flightCharges = useMemo(
    () => model.charges.map((c, i) => (i === TUNE_INDEX ? { ...c, x: flightX2 } : c)),
    [model.charges, flightX2],
  );
  const flightFields = useMemo(() => fieldsAt(flightCharges, model.probe), [flightCharges, model.probe]);

  const bookAngle = fieldKit.outputs.angle(model);
  const liveAngle = angleOf(liveFields.Enet);
  const needleAngle = tab === "whatif" ? liveAngle : bookAngle;
  const showTrueNeedle = !(tab === "guess" && phase !== "landed");
  const showGuessNeedle = tab === "guess";

  const highlighted = useMemo(() => {
    const set = new Set<string>();
    if (cue?.highlight?.length) {
      for (const name of cue.highlight) for (const part of HIGHLIGHT_MAP[name] ?? []) set.add(part);
    } else if (!cue && tab === "guess" && phase === "ready") {
      set.add("NEEDLE");
    } else if (!cue && tab === "whatif") {
      set.add("CHARGE \u2212");
      set.add("RAIL");
    }
    return set;
  }, [cue, tab, phase]);

  const focusName = storeFocus ? OBJECT_FOCUS[storeFocus] ?? storeFocus : cue?.focus ?? "home";
  const focusPose = focuses[focusName] ?? focuses.home;

  const activeFieldLinesModel = useMemo<FieldModel>(
    () => (tab === "whatif" ? { ...model, charges: liveCharges } : model),
    [model, tab, liveCharges],
  );
  const fieldLinesOpacity = cue?.show.includes("fieldLines") ? 0.85 : 0.16;

  const railMinScene = model.toScene([tuneDef.min, 0, 0])[0];
  const railMaxScene = model.toScene([tuneDef.max, 0, 0])[0];

  const buttonPos: Vec3 = [probeScene[0] + 0.55, BOARD_TOP + 0.33, probeScene[2] + 0.4];
  const hubPos: Vec3 = [probeScene[0], probeScene[1], probeScene[2]];
  const [guessMin, guessMax] = guessDef.range(model);
  const canFire = phase === "ready" && tab !== "solve";
  const dialOn = tab === "guess" && phase === "ready";
  const sliderOn = tab === "whatif" && phase === "ready";

  const testTime = cue ? restTime(model, cue) : 0;
  const showTestCharge = cue?.show.includes("testCharge") && model.testCharge;
  const showTestPath = cue?.show.includes("testPath");

  return (
    <BenchCanvas
      view={view}
      focus={focusPose}
      page={page}
      handleRef={onHandle}
      onLost={onLost}
      ariaLabel="Lab bench: a plus charge and a minus charge on rails either side of a pivoted field probe"
    >
      <Pegboard x0={plusScene[0] - 1.1} x1={railMaxScene + 1.1} highlighted={highlighted.has("PEGBOARD")} />

      <FieldLines model={activeFieldLinesModel} opacity={fieldLinesOpacity} />

      <RailTrack from={plusScene[0] - 0.65} to={plusScene[0] + 0.65} highlighted={highlighted.has("CHARGE +")} />
      <RailTrack from={railMinScene - 0.5} to={railMaxScene + 0.5} highlighted={highlighted.has("CHARGE \u2212") || highlighted.has("RAIL")} />
      <ScaleStrip from={railMinScene - 0.5} to={railMaxScene + 0.5} highlighted={highlighted.has("RAIL")} />

      <ChargePuck position={plusScene} q={model.charges[0].q} highlighted={highlighted.has("CHARGE +")} />
      <ChargePuck position={minusScene} q={model.charges[TUNE_INDEX].q} highlighted={highlighted.has("CHARGE \u2212")} />

      <ProbeStand position={probeScene} highlighted={highlighted.has("PROBE")} />

      {showTrueNeedle ? <TrueNeedle position={probeScene} target={needleAngle} length={NEEDLE_LEN} /> : null}
      {showGuessNeedle ? (
        <group position={probeScene} rotation={[0, 0, guessValue * DEG]}>
          <NeedleArrow color={tone.violet} length={NEEDLE_LEN} />
        </group>
      ) : null}

      {cue ? (
        <SolveVectors model={model} probeScene={probeScene} cue={cue} />
      ) : (
        <MeasureLayer probeScene={probeScene} fields={flightFields} phase={phase} firedAt={firedAt} onLanded={() => store.landed(firedAt)} />
      )}

      {tab === "guess" && phase === "landed" ? (
        <ValueTag
          at={[probeScene[0], probeScene[1] + NEEDLE_LEN + 0.45, probeScene[2]]}
          text={`${bookAngle.toFixed(0)}\u00b0 \u00b7 ${magnitudeOf(flightFields.Enet).toFixed(2)}\u00d710\u2076 N/C`}
          tone="yellow"
        />
      ) : null}
      {tab === "whatif" ? (
        <ValueTag
          at={[probeScene[0], probeScene[1] + NEEDLE_LEN + 0.45, probeScene[2]]}
          text={`${liveAngle.toFixed(0)}\u00b0 \u00b7 ${magnitudeOf(liveFields.Enet).toFixed(2)}\u00d710\u2076 N/C`}
        />
      ) : null}

      {showTestCharge && model.testCharge ? (
        <Ball r={0.16} position={model.toScene(model.at(testTime).p)} color={model.testCharge.q > 0 ? CORAL : BLUE} />
      ) : null}
      {showTestPath ? (
        <DashedPath points={model.testPath.filter((s) => s.t <= testTime).map((s) => model.toScene(s.p))} color={tone.violet} />
      ) : null}

      <PressButton position={buttonPos} size={[0.42, 0.34, 0.42]} enabled={canFire} onPress={() => store.fire()} />
      <Box size={[0.28, 0.1, 0.28]} position={[buttonPos[0], buttonPos[1] - 0.02, buttonPos[2]]} color={canFire ? tone.red : tone.metal} />

      <DialHandle
        position={hubPos}
        radius={0.3}
        value={guessValue}
        min={guessMin}
        max={guessMax}
        step={5}
        perPx={1}
        enabled={dialOn}
        onChange={store.setGuess}
      />
      <PathHandle
        from={railMinScene}
        length={railMaxScene - railMinScene}
        width={0.6}
        min={railMinScene}
        max={railMaxScene}
        enabled={sliderOn}
        onChange={(sceneX) => store.setTune(sceneXToMetres(model, sceneX))}
      />

      {dialOn && !guessTouched ? <Guide at={[hubPos[0], hubPos[1] + 0.5, hubPos[2]]} text="↻ Turn the needle" color={tone.violet} /> : null}
      {canFire && (tab === "whatif" || guessTouched) ? (
        <Guide at={[buttonPos[0] + 0.1, buttonPos[1] + 0.3, buttonPos[2]]} text="Press to measure!" color="#FFB3AE" align="left" />
      ) : null}

      <BenchLabels showLabels={showLabels} parts={parts} highlighted={highlighted} />
    </BenchCanvas>
  );
}
