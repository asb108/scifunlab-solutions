import type { KitDefinition, KitModel, Vec3 } from "@scifunlab/solution-sdk/kit";

type Vec2 = [number, number];
type MotionState = [number, number, number, number];

export interface FieldCharge {
  q: number; // Coulombs; kit parameters are supplied in microcoulombs.
  x: number;
}

export interface FieldModel extends KitModel {
  charges: FieldCharge[];
  probe: Vec2;
  scale: number;
  toScene(at: Vec3): Vec3;
  E(at: Vec2): Vec2;
  probeE: { E1: Vec2; E2: Vec2; Enet: Vec2 };
  testCharge: { q: number; mass: number } | null;
  testPath: { t: number; p: Vec3; v: Vec3 }[];
  at(t: number): { p: Vec3; v: Vec3 };
}

const K = 8.99e9;
const DT = 1e-3;
const T_END = 2;
const CHARGE_RADIUS = 0.35;
/** The `x2` tunable's range, in metres. Shared with `view()` below so the bench's rail is sized to fit the drag. */
const X2_MIN = 0.06;
const X2_MAX = 0.2;

function readCharges(params: Record<string, number>): FieldCharge[] {
  const charges: FieldCharge[] = [];
  for (let i = 1; params[`q${i}`] !== undefined; i++) {
    const q = params[`q${i}`];
    const x = params[`x${i}`];
    if (!Number.isFinite(q) || !Number.isFinite(x)) throw new Error(`field kit needs finite q${i} and x${i}`);
    charges.push({ q: q * 1e-6, x });
  }
  if (!charges.length) throw new Error("field kit needs at least one charge");
  return charges;
}

/** Coulomb's law sum, exported so the bench can read a live (dragged) field without rebuilding the whole model. */
export function electricField(charges: FieldCharge[], [x, y]: Vec2): Vec2 {
  let ex = 0;
  let ey = 0;
  for (const charge of charges) {
    if (charge.q === 0) continue;
    const dx = x - charge.x;
    const r2 = dx * dx + y * y;
    if (r2 === 0) throw new Error("field kit: electric field is undefined at a point charge");
    const factor = K * charge.q / (r2 * Math.sqrt(r2));
    ex += factor * dx;
    ey += factor * y;
  }
  return [ex, ey];
}

function collisionFraction(from: MotionState, to: MotionState, charges: FieldCharge[], radius: number) {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const a = dx * dx + dy * dy;
  let hit = 1;
  for (const charge of charges) {
    const x = from[0] - charge.x;
    const c = x * x + from[1] * from[1] - radius * radius;
    if (c <= 0) return 0;
    if (a === 0) continue;
    const b = 2 * (x * dx + from[1] * dy);
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) continue;
    const fraction = (-b - Math.sqrt(discriminant)) / (2 * a);
    if (fraction >= 0 && fraction <= hit) hit = fraction;
  }
  return hit;
}

function integrateTestCharge(charges: FieldCharge[], q: number, mass: number, start: Vec2, radius: number): FieldModel["testPath"] {
  let state: MotionState = [start[0], start[1], 0, 0];
  const path: FieldModel["testPath"] = [{ t: 0, p: [start[0], start[1], 0], v: [0, 0, 0] }];
  const derivative = (s: MotionState): MotionState => {
    const e = q === 0 ? [0, 0] : electricField(charges, [s[0], s[1]]);
    return [s[2], s[3], q * e[0] / mass, q * e[1] / mass];
  };
  const advance = (s: MotionState, rate: MotionState, dt: number): MotionState =>
    [s[0] + rate[0] * dt, s[1] + rate[1] * dt, s[2] + rate[2] * dt, s[3] + rate[3] * dt];
  const append = (t: number, s: MotionState) => path.push({ t, p: [s[0], s[1], 0], v: [s[2], s[3], 0] });
  for (let i = 0; i < T_END / DT; i++) {
    if (collisionFraction(state, state, charges, radius) === 0) break;
    const rates: MotionState[] = [derivative(state)];
    let stopped = false;
    for (const dt of [DT / 2, DT / 2, DT]) {
      const next = advance(state, rates[rates.length - 1], dt);
      const hit = collisionFraction(state, next, charges, radius);
      // Check RK4 stages as well as endpoints so a fast charge cannot tunnel through a source.
      if (hit < 1) {
        const contact = state.map((value, j) => value + (next[j] - value) * hit) as MotionState;
        append(i * DT + dt * hit, contact);
        stopped = true;
        break;
      }
      rates.push(derivative(next));
    }
    if (stopped) break;
    const next = state.map((value, j) => value + DT * (rates[0][j] + 2 * rates[1][j] + 2 * rates[2][j] + rates[3][j]) / 6) as MotionState;
    const hit = collisionFraction(state, next, charges, radius);
    state = state.map((value, j) => value + (next[j] - value) * hit) as MotionState;
    append(i * DT + DT * hit, state);
    if (hit < 1) break;
  }
  return path;
}

function buildModel(params: Record<string, number>): FieldModel {
  const charges = readCharges(params);
  const minX = Math.min(...charges.map((charge) => charge.x));
  const maxX = Math.max(...charges.map((charge) => charge.x));
  const scale = 6 / Math.max(maxX - minX, 0.05);
  const toScene = ([x, y, z]: Vec3): Vec3 => [(x - minX) * scale, y * scale, z * scale];
  const probe: Vec2 = [params.px ?? (minX + maxX) / 2, params.py ?? 0.05];
  if (!probe.every(Number.isFinite)) throw new Error("field kit needs finite probe coordinates");
  const E = (at: Vec2) => electricField(charges, at);
  const testCharge = params.q0 === undefined ? null : { q: params.q0 * 1e-6, mass: params.m0 ?? 1e-6 };
  const start: Vec2 = [params.x0 ?? probe[0], params.y0 ?? probe[1]];
  if (testCharge && (!Number.isFinite(testCharge.q) || !Number.isFinite(testCharge.mass) || testCharge.mass <= 0 || !start.every(Number.isFinite))) {
    throw new Error("field kit needs a finite test charge and coordinates, and m0 > 0");
  }
  const testPath = testCharge ? integrateTestCharge(charges, testCharge.q, testCharge.mass, start, CHARGE_RADIUS / scale) : [];
  const at = (t: number) => {
    if (!testPath.length) return { p: [start[0], start[1], 0] as Vec3, v: [0, 0, 0] as Vec3 };
    const index = Math.min(Math.max(0, Math.floor(t / DT)), testPath.length - 1);
    const a = testPath[index];
    const b = testPath[Math.min(index + 1, testPath.length - 1)];
    const blend = b.t === a.t ? 0 : Math.max(0, Math.min(1, (t - a.t) / (b.t - a.t)));
    return {
      p: a.p.map((value, i) => value + (b.p[i] - value) * blend) as Vec3,
      v: a.v.map((value, i) => value + (b.v[i] - value) * blend) as Vec3,
    };
  };
  const cx = (maxX - minX) * scale / 2;
  const cy = probe[1] * scale / 2;
  return {
    charges,
    probe,
    scale,
    toScene,
    E,
    probeE: { E1: electricField(charges.slice(0, 1), probe), E2: electricField(charges.slice(1, 2), probe), Enet: E(probe) },
    testCharge,
    testPath,
    at,
    times: { tEnd: T_END },
    duration: T_END,
    cameraPresets: {
      top: { position: [cx, cy, 12], target: [cx, cy, 0] },
      front: { position: [cx, cy - 9, 5], target: [cx, cy, 0] },
      side: { position: [cx + 7, cy - 6, 7], target: [cx, cy, 0] },
    },
  };
}

export function fieldArrowTip(from: Vec3, field: Vec2, length: number): Vec3 {
  const magnitude = Math.hypot(...field);
  if (magnitude === 0) return [...from];
  return [from[0] + length * field[0] / magnitude, from[1] + length * field[1] / magnitude, from[2]];
}

export function traceFieldLine(model: FieldModel, start: Vec3): Vec3[] {
  const charges = model.charges.map((charge) => ({ q: charge.q, p: model.toScene([charge.x, 0, 0]) }));
  const center = (Math.min(...charges.map((charge) => charge.p[0])) + Math.max(...charges.map((charge) => charge.p[0]))) / 2;
  const direction = (p: Vec3): Vec3 => {
    const field: Vec3 = [0, 0, 0];
    for (const charge of charges) {
      const dx = p[0] - charge.p[0];
      const r2 = dx * dx + p[1] * p[1] + p[2] * p[2];
      if (r2 === 0 || charge.q === 0) continue;
      const factor = charge.q / (r2 * Math.sqrt(r2));
      field[0] += factor * dx;
      field[1] += factor * p[1];
      field[2] += factor * p[2];
    }
    const magnitude = Math.hypot(...field);
    return magnitude === 0 ? [0, 0, 0] : field.map((value) => value / magnitude) as Vec3;
  };
  const offset = (p: Vec3, d: Vec3, h: number): Vec3 => [p[0] + d[0] * h, p[1] + d[1] * h, p[2] + d[2] * h];
  const points: Vec3[] = [start];
  const h = 0.04;
  for (let i = 0; i < 1200; i++) {
    const p = points[points.length - 1];
    if (Math.hypot(p[0] - center, p[1], p[2]) >= 9) break;
    if (charges.some((charge) => charge.q < 0 && Math.hypot(p[0] - charge.p[0], p[1], p[2]) <= CHARGE_RADIUS)) break;
    const k1 = direction(p);
    const k2 = direction(offset(p, k1, h / 2));
    const k3 = direction(offset(p, k2, h / 2));
    const k4 = direction(offset(p, k3, h));
    const next = p.map((value, j) => value + h * (k1[j] + 2 * k2[j] + 2 * k3[j] + k4[j]) / 6) as Vec3;
    if (Math.hypot(next[0] - p[0], next[1] - p[1], next[2] - p[2]) < 1e-6) break;
    points.push(next);
  }
  return points;
}

function chargeAt(model: FieldModel, sign: 1 | -1): Vec3 {
  const charge = model.charges.find((c) => Math.sign(c.q) === sign) ?? model.charges[sign > 0 ? 0 : model.charges.length - 1];
  return model.toScene([charge.x, 0, 0]);
}

export const fieldKit: KitDefinition<FieldModel> = {
  id: "field",
  objects: ["charges", "fieldLines", "E1", "E2", "Enet", "probe", "testCharge", "testPath"],
  model: (_given, params = {}) => buildModel(params),
  labels: (_given, params = {}) => ({
    ...Object.fromEntries(readCharges(params).map((charge, i) => [`q${i + 1}`, `${charge.q > 0 ? "+" : charge.q < 0 ? "-" : ""}q_${i + 1}`])),
    E1: "\\vec E_1",
    E2: "\\vec E_2",
    Enet: "\\vec E",
    probe: "P",
    testCharge: "q_0",
  }),
  outputs: {
    // E1, E2 and Enet are in units of 10^6 N/C: typical charges here give
    // fields of a few million N/C, and the board writes the "x10^6" itself.
    E1: (m) => Math.hypot(...m.probeE.E1) / 1e6,
    E2: (m) => Math.hypot(...m.probeE.E2) / 1e6,
    Enet: (m) => Math.hypot(...m.probeE.Enet) / 1e6,
    angle: (m) => (Math.atan2(m.probeE.Enet[1], m.probeE.Enet[0]) * (180 / Math.PI) + 360) % 360,
  },
  guesses: {
    direction: {
      label: "Which way the field points",
      unit: "°",
      range: () => [-180, 180],
      truth: (m) => (Math.atan2(m.probeE.Enet[1], m.probeE.Enet[0]) * (180 / Math.PI) + 360) % 360,
      handle: "dial",
    },
  },
  tunables: {
    x2: {
      label: "Position of the second charge",
      unit: "m",
      min: X2_MIN,
      max: X2_MAX,
      step: 0.005,
      handle: "slider",
      param: "x2",
      source: "params",
    },
  },
  focuses: {
    // Centred over the full rail, including the x2 slider's reach, so "home" never has to re-frame as the bench loads.
    home: (m) => {
      const left = chargeAt(m, 1)[0];
      const right = m.toScene([X2_MAX, 0, 0])[0];
      return { target: [(left + right) / 2, 1.1, 0], zoom: 1 };
    },
    probe: (m) => ({ target: m.toScene([m.probe[0], m.probe[1], 0]), zoom: 2.1 }),
  },
  parts: {
    "CHARGE +": { text: "CHARGE +", at: (m) => chargeAt(m, 1) },
    "CHARGE \u2212": { text: "CHARGE \u2212", at: (m) => chargeAt(m, -1), moving: true },
    RAIL: {
      text: "RAIL",
      at: (m) => {
        const movable = m.charges[Math.min(1, m.charges.length - 1)];
        const p = m.toScene([movable.x, 0, 0]);
        return [p[0], p[1] - 0.1, p[2] + 0.55];
      },
    },
    PROBE: { text: "PROBE", at: (m) => m.toScene([m.probe[0], m.probe[1], 0]) },
    NEEDLE: {
      text: "NEEDLE",
      at: (m) => {
        const p = m.toScene([m.probe[0], m.probe[1], 0]);
        return [p[0], p[1] + 0.4, p[2]];
      },
    },
    PEGBOARD: {
      text: "PEGBOARD",
      at: (m) => {
        const p = chargeAt(m, 1);
        return [p[0] - 0.9, p[1] - 0.1, p[2] + 0.9];
      },
    },
  },
  // Wide enough to show the plus charge's short rail and the whole 0.06-0.2 m reach of the minus charge's slider.
  view: (m) => {
    const right = m.toScene([X2_MAX, 0, 0])[0];
    return { width: Math.max(14, right + 3), height: 7 };
  },
  page: { x0: -2.2, x1: 15.5, depth: 2.4, top: -1.2 },
};
