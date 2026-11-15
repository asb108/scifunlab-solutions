/**
 * Skeleton map of HC Verma, Concepts of Physics, Vols 1 and 2. Built only from
 * public information: the table of contents and syllabus topics. Question rows
 * are not listed here; one appears when its solution file is written.
 */

import { chapterSlug, type Chapter, type ChapterGroup } from "@scifunlab/solution-sdk";

export type { Chapter, ChapterGroup };

type Row = [number: number, title: string, topics: string[]];

const rows: Row[] = [
  [1, "Introduction to Physics", ["units", "dimensions", "si-system"]],
  [2, "Physics and Mathematics", ["vectors", "vector-addition", "dot-product", "cross-product", "calculus"]],
  [3, "Rest and Motion: Kinematics", ["displacement", "velocity", "acceleration", "projectile", "relative-velocity"]],
  [4, "The Forces", ["gravitational-force", "electromagnetic-force", "nuclear-force"]],
  [5, "Newton's Laws of Motion", ["newtons-laws", "free-body-diagram", "pulley", "pseudo-force"]],
  [6, "Friction", ["static-friction", "kinetic-friction", "inclined-plane", "blocks"]],
  [7, "Circular Motion", ["angular-velocity", "centripetal-force", "banking", "vertical-circle"]],
  [8, "Work and Energy", ["work", "kinetic-energy", "potential-energy", "power", "springs"]],
  [9, "Centre of Mass, Linear Momentum, Collision", ["centre-of-mass", "momentum", "collision", "impulse"]],
  [10, "Rotational Mechanics", ["torque", "moment-of-inertia", "angular-momentum", "rolling"]],
  [11, "Gravitation", ["universal-gravitation", "gravitational-field", "orbits", "escape-velocity"]],
  [12, "Simple Harmonic Motion", ["shm", "pendulum", "spring-mass", "energy-in-shm"]],
  [13, "Fluid Mechanics", ["pressure", "buoyancy", "bernoulli", "continuity"]],
  [14, "Some Mechanical Properties of Matter", ["elasticity", "surface-tension", "viscosity"]],
  [15, "Wave Motion and Waves on a String", ["wave-equation", "string-waves", "superposition", "standing-waves"]],
  [16, "Sound Waves", ["speed-of-sound", "interference", "resonance", "doppler-effect"]],
  [17, "Light Waves", ["huygens-principle", "interference", "youngs-double-slit", "diffraction"]],
  [18, "Geometrical Optics", ["reflection", "refraction", "mirrors", "lenses", "prisms"]],
  [19, "Optical Instruments", ["eye", "microscope", "telescope", "magnification"]],
  [20, "Dispersion and Spectra", ["dispersion", "dispersive-power", "spectra"]],
  [21, "Speed of Light", ["measuring-light-speed"]],
  [22, "Photometry", ["luminous-intensity", "illuminance"]],
  [23, "Heat and Temperature", ["temperature-scales", "thermal-expansion", "ideal-gas"]],
  [24, "Kinetic Theory of Gases", ["kinetic-theory", "rms-speed", "pressure-of-gas"]],
  [25, "Calorimetry", ["specific-heat", "latent-heat", "calorimetry"]],
  [26, "Laws of Thermodynamics", ["first-law", "second-law", "heat-engines"]],
  [27, "Specific Heat Capacities of Gases", ["cp-cv", "adiabatic-process", "isothermal-process"]],
  [28, "Heat Transfer", ["conduction", "convection", "radiation", "newtons-cooling"]],
  [29, "Electric Field and Potential", ["coulombs-law", "electric-field", "electric-potential", "dipole", "field-lines"]],
  [30, "Gauss's Law", ["electric-flux", "gauss-law", "symmetric-charges"]],
  [31, "Capacitors", ["capacitance", "dielectrics", "capacitor-combinations", "energy-stored"]],
  [32, "Electric Current in Conductors", ["ohms-law", "kirchhoff-laws", "circuits", "wheatstone-bridge"]],
  [33, "Thermal and Chemical Effects of Electric Current", ["joule-heating", "electrolysis", "thermocouple"]],
  [34, "Magnetic Field", ["magnetic-force", "charge-in-magnetic-field", "force-on-current"]],
  [35, "Magnetic Field due to a Current", ["biot-savart", "amperes-law", "solenoid"]],
  [36, "Permanent Magnets", ["magnetic-dipole", "earths-magnetism"]],
  [37, "Magnetic Properties of Matter", ["magnetisation", "para-dia-ferro"]],
  [38, "Electromagnetic Induction", ["faradays-law", "lenz-law", "inductance", "lr-circuits"]],
  [39, "Alternating Current", ["rms-values", "lcr-circuits", "resonance", "transformers"]],
  [40, "Electromagnetic Waves", ["displacement-current", "em-spectrum"]],
  [41, "Electric Current through Gases", ["discharge-tubes", "cathode-rays", "thermionic-emission"]],
  [42, "Photoelectric Effect and Wave-Particle Duality", ["photoelectric-effect", "photons", "de-broglie"]],
  [43, "Bohr's Model and Physics of the Atom", ["bohr-model", "hydrogen-spectrum", "energy-levels"]],
  [44, "X-rays", ["x-ray-production", "moseley-law"]],
  [45, "Semiconductors and Semiconductor Devices", ["pn-junction", "diodes", "transistors", "logic-gates"]],
  [46, "The Nucleus", ["nuclear-binding", "radioactivity", "fission-fusion"]],
  [47, "The Special Theory of Relativity", ["time-dilation", "length-contraction", "mass-energy"]],
];

function groupFor(n: number): ChapterGroup {
  if (n <= 14) return "mechanics";
  if (n <= 16) return "waves";
  if (n <= 22) return "optics";
  if (n <= 28) return "thermal";
  if (n <= 33) return "electricity";
  if (n <= 40) return "magnetism";
  return "modern";
}

export const hcVermaChapters: readonly Chapter[] = rows.map(([number, title, topics]) => ({
  number,
  volume: number <= 22 ? 1 : 2,
  title,
  slug: chapterSlug(number, title),
  group: groupFor(number),
  topics,
}));

export function chapterByNumber(n: number): Chapter {
  const chapter = hcVermaChapters.find((c) => c.number === n);
  if (!chapter) throw new Error(`HC Verma has no chapter ${n}`);
  return chapter;
}

export function chapterBySlug(slug: string): Chapter | undefined {
  return hcVermaChapters.find((c) => c.slug === slug);
}
