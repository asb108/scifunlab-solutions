import type { KitDefinition, KitModel, Vec3 } from "@scifunlab/solution-sdk/kit";

/**
 * Block A (m1) on a rough incline of angle alpha (0 = a table), tied over a
 * pulley at the top edge to hanging block B (m2). Friction mu acts on A.
 *
 * Sign convention: positive acceleration means B falls and A slides up the
 * slope. One signed `a` then covers both directions:
 *   D = m2 g − m1 g sin α
 *   a = 0 when |D| ≤ μ N, otherwise a = sign(D) (|D| − μ N) / (m1 + m2)
 *   T = m2 (g − a)  (B's equation; still right when a is negative)
 * Displacement along the string is s = ½ a t². Scene positions are that
 * motion scaled to fit the viewport.
 */
export interface BlocksModel extends KitModel {
  a: number;
  T: number;
  N: number;
  f: number;
  m1: number;
  m2: number;
  /** Incline angle in radians. */
  alpha: number;
  mu: number;
  g: number;
  /** The metres of fall the bench's fixed metre-to-scene-unit `scale` is sized for (its vertical ruler's top mark). */
  drop: number;
  /** Scene units per metre along the string. */
  scale: number;
  /** Unit vector up the slope, toward the pulley. */
  upSlope: Vec3;
  /** Unit vector out of the slope, from the ramp toward block A. */
  normal: Vec3;
  /** Top edge of the slope, where the string leaves the ramp. */
  lip: Vec3;
  rampCenter: Vec3;
  slopeLen: number;
  rampThick: number;
  rampDepth: number;
  pulley: Vec3;
  pulleyR: number;
  pulleyTube: number;
  blockA: { along: number; thick: number; depth: number };
  /** Side length of the hanging cube. */
  blockB: number;
  /** True when friction on A points down the slope. */
  frictionDown: boolean;
  /** Tip offsets from each block's centre, in scene units. */
  arrows: {
    N: Vec3;
    fA: Vec3;
    gA: Vec3;
    T_A: Vec3;
    T_B: Vec3;
    gB: Vec3;
    aA: Vec3;
    aB: Vec3;
  };
  /** Bodies and arrow tips, used to frame the poster. */
  frame: { minX: number; maxX: number; minY: number; maxY: number };
  floorY: number;
  /** `s` is metres along the string; `A` and `B` are scene-unit centres. */
  at(t: number): { s: number; A: Vec3; B: Vec3 };
}

const DEG = Math.PI / 180;

/** Largest force arrow, before the layout fit scale. About 2 scene units. */
const MAX_ARROW = 1.9;
const TRAVEL = 1.32;
const BLOCK_A = { along: 0.78, thick: 0.46, depth: 0.68 };
const BLOCK_B = 0.58;
const PULLEY_R = 0.32;
const PULLEY_TUBE = 0.068;
const RAMP_THICK = 0.4;
const RAMP_DEPTH = 1.42;

function needFinite(value: number, name: string): number {
  if (!Number.isFinite(value)) throw new Error(`blocks kit needs a finite ${name}`);
  return value;
}

function withLength(dir: Vec3, length: number): Vec3 {
  const n = Math.hypot(dir[0], dir[1], dir[2]);
  if (n < 1e-8 || length <= 0) return [0, 0, 0];
  const k = length / n;
  return [dir[0] * k, dir[1] * k, dir[2] * k];
}

/** Side view of the ramp: high top, low top, low bottom, high bottom. */
export function rampProfile(model: BlocksModel): Vec3[] {
  const c = model.rampCenter;
  const u = model.upSlope;
  const n = model.normal;
  const hx = model.slopeLen / 2;
  const hy = model.rampThick / 2;
  const corner = (su: number, sn: number): Vec3 => [
    c[0] + u[0] * hx * su + n[0] * hy * sn,
    c[1] + u[1] * hx * su + n[1] * hy * sn,
    0,
  ];
  return [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];
}

/** Side view of block A, wound the same way as the ramp. */
export function blockAProfile(model: BlocksModel, center: Vec3): Vec3[] {
  const u = model.upSlope;
  const n = model.normal;
  const hx = model.blockA.along / 2;
  const hy = model.blockA.thick / 2;
  const corner = (su: number, sn: number): Vec3 => [
    center[0] + u[0] * hx * su + n[0] * hy * sn,
    center[1] + u[1] * hx * su + n[1] * hy * sn,
    0,
  ];
  return [corner(1, 1), corner(-1, 1), corner(-1, -1), corner(1, -1)];
}

/** String from A's uphill face, over the top of the pulley, and down its right side to B. */
export function stringPoints(model: BlocksModel, A: Vec3, B: Vec3): Vec3[] {
  const u = model.upSlope;
  const half = model.blockA.along / 2;
  const z = 0.08;
  const fromA: Vec3 = [A[0] + u[0] * half, A[1] + u[1] * half, z];
  const cx = model.pulley[0];
  const cy = model.pulley[1];
  const r = model.pulleyR;
  const wrap: Vec3[] = [];
  for (let i = 0; i <= 6; i++) {
    const ang = (Math.PI / 2) * (1 - i / 6);
    wrap.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, z]);
  }
  const fromB: Vec3 = [B[0], B[1] + model.blockB / 2, z];
  return [fromA, ...wrap, fromB];
}

/** Radians the pulley has turned. Negative is clockwise when seen from the front, which is B falling. */
export function pulleySpin(model: BlocksModel, sMetres: number): number {
  if (model.pulleyR < 1e-6) return 0;
  return -(model.scale * sMetres) / model.pulleyR;
}

function buildModel(given: Record<string, number>, params?: Record<string, number>): BlocksModel {
  const m1 = needFinite(given.m1, "m1");
  const m2 = needFinite(given.m2, "m2");
  const alphaDeg = needFinite(given.alpha ?? 0, "alpha");
  const mu = needFinite(given.mu ?? 0, "mu");
  const g = needFinite(given.g ?? 9.8, "g");
  const drop = needFinite(params?.drop ?? 1, "drop");
  if (!(m1 > 0) || !(m2 > 0)) throw new Error("blocks kit needs m1 > 0 and m2 > 0");
  if (!(g > 0)) throw new Error("blocks kit needs g > 0");
  if (!(mu >= 0)) throw new Error("blocks kit needs mu >= 0");
  if (!(drop > 0)) throw new Error("blocks kit needs drop > 0");
  if (alphaDeg < 0 || alphaDeg > 90) throw new Error("blocks kit needs alpha between 0 and 90 degrees");

  const alpha = alphaDeg * DEG;
  const sinA = Math.sin(alpha);
  const cosA = Math.cos(alpha);
  const N = m1 * g * cosA;
  const f = mu * N;
  const D = m2 * g - m1 * g * sinA;
  // This kit only models one direction: B falls, A slides up. If the net pull
  // can't beat friction (|D| <= f) -- or even points the other way (D < 0,
  // m1's own weight component would need to drag B *up*) -- the bench is not
  // built to show that, so the blocks simply stay put (a = 0) rather than
  // reversing. Clamping D - f to >= 0 covers both cases in one line.
  const a = Math.max(0, D - f) / (m1 + m2);
  // B: m2 g − T = m2 a when down is positive, so T = m2 (g − a) for a rise too.
  const T = m2 * (g - a);
  // The bench always releases the blocks for exactly one second of motion
  // (dropIn1s = 0.5 a * 1^2 is literally "how far B falls in 1 s"); `drop`
  // only sizes the scene's metre-to-scene-unit `scale` (ruler, pulley spin),
  // not how long the flight lasts.
  const tEnd = 1;

  const upSlope: Vec3 = [cosA, sinA, 0];
  const normal: Vec3 = [-sinA, cosA, 0];
  const down: Vec3 = [0, -1, 0];
  const up: Vec3 = [0, 1, 0];
  const downSlope: Vec3 = [-cosA, -sinA, 0];
  // The kit's only modelled direction is A sliding up, so friction on A always
  // opposes that: it points down the slope.
  const frictionDown = true;

  const travel = TRAVEL;
  const startDist = travel + BLOCK_A.along * 0.5 + 0.32;
  const slopeLen = startDist + travel + BLOCK_A.along * 0.5 + 0.48;
  const hangStart = travel + PULLEY_R + BLOCK_B * 0.5 + 0.2;
  const seat = BLOCK_A.thick / 2 + 0.02;
  const rampRight = RAMP_THICK * sinA;
  const pulleyRelX = rampRight + PULLEY_R * 0.62;
  const pulleyRelY = PULLEY_R * 0.46;

  const rel: { x: number; y: number }[] = [];
  const add = (x: number, y: number) => rel.push({ x, y });
  const rcx = -upSlope[0] * (slopeLen / 2) - normal[0] * (RAMP_THICK / 2);
  const rcy = -upSlope[1] * (slopeLen / 2) - normal[1] * (RAMP_THICK / 2);
  for (const su of [-1, 1]) {
    for (const sn of [-1, 1]) {
      add(rcx + upSlope[0] * (slopeLen / 2) * su + normal[0] * (RAMP_THICK / 2) * sn, rcy + upSlope[1] * (slopeLen / 2) * su + normal[1] * (RAMP_THICK / 2) * sn);
    }
  }
  add(pulleyRelX - PULLEY_R - PULLEY_TUBE, pulleyRelY);
  add(pulleyRelX + PULLEY_R + PULLEY_TUBE, pulleyRelY);
  add(pulleyRelX, pulleyRelY + PULLEY_R + PULLEY_TUBE);
  add(pulleyRelX, pulleyRelY - PULLEY_R - PULLEY_TUBE);
  for (const disp of [-travel, travel]) {
    const dist = startDist - disp;
    const ax = -upSlope[0] * dist + normal[0] * seat;
    const ay = -upSlope[1] * dist + normal[1] * seat;
    for (const su of [-1, 1]) {
      for (const sn of [-1, 1]) {
        add(ax + upSlope[0] * (BLOCK_A.along / 2) * su + normal[0] * (BLOCK_A.thick / 2) * sn, ay + upSlope[1] * (BLOCK_A.along / 2) * su + normal[1] * (BLOCK_A.thick / 2) * sn);
      }
    }
    const hangX = pulleyRelX + PULLEY_R;
    const by = pulleyRelY - hangStart - disp;
    add(hangX - BLOCK_B / 2, by - BLOCK_B / 2);
    add(hangX + BLOCK_B / 2, by + BLOCK_B / 2);
    add(hangX - BLOCK_B / 2, by + BLOCK_B / 2);
    add(hangX + BLOCK_B / 2, by - BLOCK_B / 2);
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of rel) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  // Leave the margins for arrows: x about [-1, 8], y about [-1, 6].
  const boxW = 6.55;
  const boxH = 4.05;
  const fit = Math.min(1, boxW / Math.max(maxX - minX, 0.01), boxH / Math.max(maxY - minY, 0.01));
  let ox = 0.4 - minX * fit;
  let oy = 1.15 - minY * fit;

  const S = (v: number) => v * fit;
  const arrowScale = fit;
  const maxForce = Math.max(N, f, m1 * g, m2 * g, Math.abs(T), 1e-6);
  const forceScale = (MAX_ARROW * arrowScale) / maxForce;
  const aLen = Math.abs(a) < 1e-8 ? 0 : Math.min(MAX_ARROW, Math.max(1.05, (2 * Math.abs(a)) / g)) * arrowScale;
  const arrows = {
    N: withLength(normal, N * forceScale),
    fA: withLength(frictionDown ? downSlope : upSlope, f * forceScale),
    gA: withLength(down, m1 * g * forceScale),
    T_A: withLength(upSlope, Math.max(T, 0) * forceScale),
    T_B: withLength(up, Math.max(T, 0) * forceScale),
    gB: withLength(down, m2 * g * forceScale),
    aA: withLength(a >= 0 ? upSlope : downSlope, aLen),
    aB: withLength(a >= 0 ? down : up, aLen),
  };

  // Shift so the longest arrows stay inside the viewport.
  const probe = (disp: number) => {
    const ax = (-upSlope[0] * (startDist - disp) + normal[0] * seat) * fit + ox;
    const ay = (-upSlope[1] * (startDist - disp) + normal[1] * seat) * fit + oy;
    const bx = (pulleyRelX + PULLEY_R) * fit + ox;
    const by = (pulleyRelY - hangStart - disp) * fit + oy;
    return [
      [ax, ay],
      [bx, by],
      [ax + arrows.N[0], ay + arrows.N[1]],
      [ax + arrows.fA[0], ay + arrows.fA[1]],
      [ax + arrows.gA[0], ay + arrows.gA[1]],
      [ax + arrows.T_A[0], ay + arrows.T_A[1]],
      [ax + arrows.aA[0], ay + arrows.aA[1]],
      [bx + arrows.T_B[0], by + arrows.T_B[1]],
      [bx + arrows.gB[0], by + arrows.gB[1]],
      [bx + arrows.aB[0], by + arrows.aB[1]],
    ];
  };
  const tips = [...probe(-travel), ...probe(travel)];
  let tipMinX = Infinity;
  let tipMaxX = -Infinity;
  let tipMinY = Infinity;
  let tipMaxY = -Infinity;
  for (const [x, y] of tips) {
    tipMinX = Math.min(tipMinX, x);
    tipMaxX = Math.max(tipMaxX, x);
    tipMinY = Math.min(tipMinY, y);
    tipMaxY = Math.max(tipMaxY, y);
  }
  if (tipMinX < -0.75) ox += -0.75 - tipMinX;
  if (tipMaxX > 7.7) ox -= tipMaxX - 7.7;
  if (tipMinY < -0.75) oy += -0.75 - tipMinY;
  if (tipMaxY > 5.75) oy -= tipMaxY - 5.75;

  const world = (x: number, y: number): Vec3 => [x * fit + ox, y * fit + oy, 0];
  const lip = world(0, 0);
  const pulley = world(pulleyRelX, pulleyRelY);
  const rampCenter = world(rcx, rcy);
  const slopeLenW = S(slopeLen);
  const rampThickW = S(RAMP_THICK);
  const blockA = { along: S(BLOCK_A.along), thick: S(BLOCK_A.thick), depth: S(BLOCK_A.depth) };
  const blockB = S(BLOCK_B);
  const startDistW = S(startDist);
  const hangStartW = S(hangStart);
  const scale = S(travel) / drop;
  const pulleyR = S(PULLEY_R);
  const seatW = S(seat);

  const at = (t: number) => {
    const tc = Math.min(Math.max(t, 0), tEnd);
    const s = 0.5 * a * tc * tc;
    const disp = scale * s;
    const dist = startDistW - disp;
    const A: Vec3 = [lip[0] - upSlope[0] * dist + normal[0] * seatW, lip[1] - upSlope[1] * dist + normal[1] * seatW, 0];
    const B: Vec3 = [pulley[0] + pulleyR, pulley[1] - hangStartW - disp, 0];
    return { s, A, B };
  };

  const bodyPts: Vec3[] = [];
  const framePts: Vec3[] = [];
  const pushBox = (bucket: Vec3[], center: Vec3, hx: number, hy: number, along: Vec3, across: Vec3) => {
    for (const su of [-1, 1]) {
      for (const sn of [-1, 1]) {
        bucket.push([center[0] + along[0] * hx * su + across[0] * hy * sn, center[1] + along[1] * hx * su + across[1] * hy * sn, 0]);
      }
    }
  };
  const pose0 = at(0);
  const pose1 = at(tEnd);
  pushBox(bodyPts, rampCenter, slopeLenW / 2, rampThickW / 2, upSlope, normal);
  pushBox(bodyPts, pose0.A, blockA.along / 2, blockA.thick / 2, upSlope, normal);
  pushBox(bodyPts, pose1.A, blockA.along / 2, blockA.thick / 2, upSlope, normal);
  for (const pose of [pose0, pose1]) {
    pushBox(bodyPts, pose.B, blockB / 2, blockB / 2, [1, 0, 0], [0, 1, 0]);
  }
  bodyPts.push([pulley[0] - pulleyR, pulley[1], 0], [pulley[0] + pulleyR, pulley[1], 0], [pulley[0], pulley[1] + pulleyR, 0], [pulley[0], pulley[1] - pulleyR, 0]);
  framePts.push(...bodyPts);
  for (const pose of [pose0, pose1]) {
    for (const arrow of [arrows.N, arrows.fA, arrows.gA, arrows.T_A, arrows.aA]) {
      framePts.push([pose.A[0] + arrow[0], pose.A[1] + arrow[1], 0]);
    }
    for (const arrow of [arrows.T_B, arrows.gB, arrows.aB]) {
      framePts.push([pose.B[0] + arrow[0], pose.B[1] + arrow[1], 0]);
    }
  }

  let fMinX = Infinity;
  let fMaxX = -Infinity;
  let fMinY = Infinity;
  let fMaxY = -Infinity;
  let bodyMinY = Infinity;
  for (const p of framePts) {
    fMinX = Math.min(fMinX, p[0]);
    fMaxX = Math.max(fMaxX, p[0]);
    fMinY = Math.min(fMinY, p[1]);
    fMaxY = Math.max(fMaxY, p[1]);
  }
  for (const p of bodyPts) bodyMinY = Math.min(bodyMinY, p[1]);
  const frame = { minX: fMinX, maxX: fMaxX, minY: fMinY, maxY: fMaxY };
  const cx = (fMinX + fMaxX) / 2;
  const cy = (fMinY + fMaxY) / 2;
  const span = Math.max(fMaxX - fMinX, fMaxY - fMinY, 3);
  const dist = (span / 2) / Math.tan((40 * DEG) / 2) * 1.18;

  return {
    a,
    T,
    N,
    f,
    m1,
    m2,
    alpha,
    mu,
    g,
    drop,
    scale,
    upSlope,
    normal,
    lip,
    rampCenter,
    slopeLen: slopeLenW,
    rampThick: rampThickW,
    rampDepth: S(RAMP_DEPTH),
    pulley,
    pulleyR,
    pulleyTube: S(PULLEY_TUBE),
    blockA,
    blockB,
    frictionDown,
    arrows,
    frame,
    floorY: bodyMinY - 0.02,
    at,
    times: { tMove: 0, tEnd },
    duration: tEnd,
    cameraPresets: {
      front: { position: [cx, cy, dist], target: [cx, cy, 0] },
      side: { position: [cx + dist * 0.8, cy + span * 0.3, dist * 0.85], target: [cx, cy - span * 0.1, 0] },
      top: { position: [cx, cy + Math.max(dist, 9), 0.28], target: [cx, cy, 0] },
    },
  };
}

export const blocksKit: KitDefinition<BlocksModel> = {
  id: "blocks",
  objects: ["incline", "pulley", "string", "blockA", "blockB", "N", "fA", "gA", "T_A", "T_B", "gB", "a", "fbdA", "fbdB"],
  model: (given, params) => buildModel(given, params),
  labels: () => ({
    N: "N",
    fA: "f",
    gA: "m_1 g",
    T_A: "T",
    T_B: "T",
    gB: "m_2 g",
    a: "a",
  }),
  outputs: {
    a: (m) => m.a,
    T: (m) => m.T,
    N: (m) => m.N,
    f: (m) => m.f,
    dropIn1s: (m) => 0.5 * m.a,
  },
  guesses: {
    dropIn1s: {
      label: "How far B falls in 1 s",
      unit: "m",
      range: () => [0, 2.5],
      truth: (m) => 0.5 * m.a,
      handle: "path",
    },
  },
  tunables: {
    m2: {
      label: "Mass of B",
      unit: "kg",
      min: 0.5,
      max: 5,
      step: 0.05,
      handle: "knob",
      param: "m2",
      source: "given",
    },
  },
  focuses: {
    home: (m) => ({ target: m.cameraPresets!.front!.target, zoom: 1 }),
    pulley: (m) => ({ target: m.pulley, zoom: 2 }),
    blockA: (m) => ({ target: m.at(0).A, zoom: 2.2 }),
  },
  parts: {
    PULLEY: { text: "PULLEY", at: (m) => m.pulley },
    CORD: { text: "CORD", at: (m) => m.lip },
    "BLOCK A": { text: "BLOCK A", at: (m) => m.at(0).A },
    "BLOCK B": { text: "BLOCK B", at: (m) => m.at(0).B, moving: true },
    "FELT PAD": {
      text: "FELT PAD",
      at: (m) => {
        // Midway along A's one-second travel, on the ramp's surface.
        const a0 = m.at(0).A;
        const a1 = m.at(1).A;
        const mid: Vec3 = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, 0];
        return [mid[0] - m.normal[0] * (m.blockA.thick / 2 + 0.05), mid[1] - m.normal[1] * (m.blockA.thick / 2 + 0.05), mid[2]];
      },
    },
    // Bolted to the base, just in front of the ramp (see Bench.tsx's `Stopwatch`).
    STOPWATCH: { text: "STOPWATCH", at: (m) => [m.rampCenter[0], m.floorY - 0.08 + 0.26, m.rampDepth / 2 + 0.38] },
    // Beside B's resting height, reading "0" there (see Bench.tsx's `Ruler`).
    RULER: {
      text: "RULER",
      at: (m) => {
        const b0 = m.at(0).B;
        return [b0[0] + m.blockB / 2 + 0.56, b0[1] - 0.6, b0[2]];
      },
    },
  },
  view: () => ({ width: 9.6, height: 6.8 }),
  page: { x0: -1.1, x1: 9.2, depth: 2.3, top: 0.82 },
};
