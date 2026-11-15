import type { KitDefinition, KitModel, Vec3 } from "@scifunlab/solution-sdk/kit";

/**
 * Projectile launched from the origin (optionally from height h) at angle
 * theta above the horizontal, landing on flat ground or on a slope of angle
 * alpha rising in +x. Motion stays in the x-y plane. All values in SI units;
 * `scale` converts metres to scene units so every problem fits the viewport.
 */
export interface ProjectileModel extends KitModel {
  u: number;
  theta: number;
  alpha: number;
  h: number;
  g: number;
  scale: number;
  landing: Vec3;
  rangeAlongSlope: number;
  peakHeight: number;
  at(t: number): { p: Vec3; v: Vec3 };
}

const DEG = Math.PI / 180;

function buildModel(given: Record<string, number>): ProjectileModel {
  const u = given.u;
  const theta = given.theta * DEG;
  const alpha = (given.alpha ?? 0) * DEG;
  const h = given.h ?? 0;
  const g = given.g ?? 9.8;
  if (!(u > 0)) throw new Error("projectile kit needs u > 0");
  if (h === 0 && theta <= alpha) throw new Error("projectile kit: launch angle must be above the slope");

  // Landing where y(t) = x(t) tan(alpha): (g/2) t^2 - b t - h = 0.
  const b = u * (Math.sin(theta) - Math.cos(theta) * Math.tan(alpha));
  const tFlight = (b + Math.sqrt(b * b + 2 * g * h)) / g;
  const tPeak = Math.max(0, (u * Math.sin(theta)) / g);

  const at = (t: number) => {
    const x = u * Math.cos(theta) * t;
    const y = h + u * Math.sin(theta) * t - 0.5 * g * t * t;
    return { p: [x, y, 0] as Vec3, v: [u * Math.cos(theta), u * Math.sin(theta) - g * t, 0] as Vec3 };
  };

  const landing = at(tFlight).p;
  const peakHeight = at(Math.min(tPeak, tFlight)).p[1];
  const extent = Math.max(landing[0], peakHeight * 1.6, 4);
  const scale = 7 / extent;
  const mid = (landing[0] * scale) / 2;
  const lift = Math.max(peakHeight * scale * 0.5, 1.5);

  return {
    u,
    theta,
    alpha,
    h,
    g,
    scale,
    landing,
    rangeAlongSlope: landing[0] / Math.cos(alpha),
    peakHeight,
    at,
    times: { tPeak, tFlight },
    duration: tFlight,
    cameraPresets: {
      front: { position: [mid, lift + 0.6, 13], target: [mid, lift, 0] },
      side: { position: [mid + 7.5, lift + 4.5, 9.5], target: [mid, lift * 0.7, 0] },
      top: { position: [mid, 15, 0.01], target: [mid, 0, 0] },
    },
  };
}

/** One ball radius above the foot of the slope, along the slope's normal. */
const BALL_R = 0.14;
/** Height, above the base plate, of the hinge the plank pivots on. */
const BASE_TOP = -0.6;

function slopeAxes(alpha: number): { along: [number, number]; normal: [number, number] } {
  return { along: [Math.cos(alpha), Math.sin(alpha)], normal: [-Math.sin(alpha), Math.cos(alpha)] };
}

function launchPoint(alpha: number): Vec3 {
  const { normal } = slopeAxes(alpha);
  return [normal[0] * BALL_R, normal[1] * BALL_R, 0];
}

/** World position of the ball at time `t`, launcher included. */
function ballAt(m: ProjectileModel, t: number): Vec3 {
  const p0 = launchPoint(m.alpha);
  const { p } = m.at(t);
  return [p0[0] + p[0], p0[1] + p[1], p0[2] + p[2]];
}

/** A point `s` metres along the slope from its foot, `z` out of the page. */
function alongSlope(alpha: number, s: number, z = 0): Vec3 {
  return [s * Math.cos(alpha), s * Math.sin(alpha), z];
}

export const projectileKit: KitDefinition<ProjectileModel> = {
  id: "projectile",
  objects: ["ground", "slope", "axes", "ball", "u", "ux", "uy", "g", "path", "landing", "range"],
  model: (given) => buildModel(given),
  labels: (given) => {
    const m = buildModel(given);
    const onSlope = m.alpha !== 0;
    return {
      u: `u = ${m.u}\\,\\mathrm{m/s}`,
      ux: onSlope ? "u_x" : `u\\cos\\theta`,
      uy: onSlope ? "u_y" : `u\\sin\\theta`,
      g: "g",
      range: `${m.rangeAlongSlope.toFixed(2)}\\,\\mathrm{m}`,
      axisX: "x",
      axisY: "y",
    };
  },
  outputs: {
    /** Launch angle measured from the slope, in degrees (theta - alpha). */
    phi: (m) => (m.theta - m.alpha) / DEG,
    ux: (m) => m.u * Math.cos(m.theta - m.alpha),
    uy: (m) => m.u * Math.sin(m.theta - m.alpha),
    gx: (m) => m.g * Math.sin(m.alpha),
    gy: (m) => m.g * Math.cos(m.alpha),
    T: (m) => m.times.tFlight,
    range: (m) => m.rangeAlongSlope,
    uxT: (m) => m.u * Math.cos(m.theta - m.alpha) * m.times.tFlight,
    drag: (m) => 0.5 * m.g * Math.sin(m.alpha) * m.times.tFlight * m.times.tFlight,
    peak: (m) => m.peakHeight,
  },
  guesses: {
    landing: {
      label: "Where it lands",
      unit: "m",
      range: () => [0.5, 8.9],
      truth: (m) => m.rangeAlongSlope,
      handle: "path",
    },
  },
  tunables: {
    theta: {
      label: "Launcher angle",
      unit: "°",
      min: 25,
      max: 80,
      step: 0.5,
      handle: "dial",
      param: "theta",
      source: "given",
    },
  },
  focuses: {
    home: () => ({ target: [4.0, 0.7, 0], zoom: 1 }),
    launch: (m) => {
      const p = ballAt(m, 0);
      return { target: [p[0] + 0.7, p[1] + 0.6, 0], zoom: 2.3 };
    },
    peak: (m) => {
      const p = ballAt(m, m.times.tFlight / 2);
      return { target: [p[0] - 0.2, p[1] - 0.5, 0], zoom: 2 };
    },
  },
  parts: {
    LAUNCHER: { text: "LAUNCHER", at: (m) => { const p = launchPoint(m.alpha); return [p[0] - 0.35, p[1] + 0.35, 0]; } },
    SPRING: { text: "SPRING", at: (m) => { const p = launchPoint(m.alpha); return [p[0] - 0.42, p[1] + 0.12, 0]; }, moving: true },
    "ANGLE DIAL": { text: "ANGLE DIAL", at: (m) => { const p = launchPoint(m.alpha); return [p[0], p[1], 0.95]; } },
    RULER: { text: "RULER", at: (m) => alongSlope(m.alpha, 4.5, 0.55) },
    PROTRACTOR: { text: "PROTRACTOR", at: () => [1.1, BASE_TOP + 0.55, -0.78] },
    HINGE: { text: "HINGE", at: () => [0.38, BASE_TOP - 0.1, 0] },
    "CLAMP COLLAR": { text: "CLAMP COLLAR", at: (m) => alongSlope(m.alpha, 8.8, 0.7) },
  },
  view: () => ({ width: 11.2, height: 6.2 }),
  page: { x0: -3.4, x1: 11.4, depth: 2.7, top: -1.1 },
};
