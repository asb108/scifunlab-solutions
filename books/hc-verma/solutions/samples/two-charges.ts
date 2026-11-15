import { defineSolution } from "@scifunlab/solution-sdk";

/**
 * Our own sample problem (not a book question). Check by hand:
 * r = sqrt(0.05^2 + 0.05^2) = 0.0707 m, r^2 = 0.005 m^2
 * E1 = E2 = (8.99e9)(2e-6)/0.005 = 3.60e6 N/C; vertical parts cancel,
 * E = 2 (3.60e6) cos 45 = 5.09e6 N/C along +x (from q1 towards q2, angle 0).
 */
export default defineSolution({
  citation: { book: "hc-verma", volume: 2, chapter: 29, section: "sample", number: 1 },
  title: "The field between two opposite charges",
  inShort: "Charges of +2 µC and −2 µC sit 10 cm apart. Find the electric field at a point 5 cm above the midpoint.",
  given: {
    q1: [2, "\\mu C", "q_1"],
    q2: [-2, "\\mu C", "q_2"],
    d: [0.1, "m", "d"],
    h: [0.05, "m", "h"],
  },
  kitParams: { q1: 2, x1: 0, q2: -2, x2: 0.1, px: 0.05, py: 0.05 },
  topics: ["electric-field", "coulombs-law", "field-lines", "vectors"],
  difficulty: 2,
  access: "free",
  kit: "field",
  relatedLab: "/simulations/science/physics/electric-fields",
  sample: true,
  guess: { use: "direction", tolerance: 10 },
  whatIf: { tune: "x2" },
  steps: [
    {
      title: "Two charges and a point",
      board: ["q1 at left, q2 at right, P between", "P is equally far from both charges"],
      describe: "Seen from above: a coral positive charge on the left, a violet negative charge on the right, and a small probe point above the middle.",
      cue: { show: ["charges", "probe"], at: 0, focus: "home" },
    },
    {
      title: "Field from q₁",
      board: ["E1 points away from the + charge", "blue:E1 = (({E1:2} × 10^6 N/C|circle))"],
      describe: "A yellow arrow at P points up and to the right, away from the positive charge.",
      cue: { show: ["charges", "probe", "E1"], highlight: ["E1"], at: 0, focus: "probe" },
    },
    {
      title: "Field from q₂",
      board: ["E2 points toward the − charge", "blue:E2 = (({E2:2} × 10^6 N/C|circle))"],
      describe: "A second yellow arrow at P points down and to the right, towards the negative charge.",
      cue: { show: ["charges", "probe", "E1", "E2"], highlight: ["E2"], at: 0, focus: "probe" },
    },
    {
      title: "Add the two fields",
      board: ["Up-down cancels; sideways adds", "yellow:lg:Enet = (({Enet:2} × 10^6 N/C|box)) !tick"],
      describe: "A thick yellow arrow at P points straight to the right: the sum of the two fields.",
      cue: { show: ["charges", "probe", "E1", "E2", "Enet"], highlight: ["Enet"], at: 0, focus: "probe" },
    },
    {
      title: "See the whole field",
      board: ["Lines run from + charge to − charge", "At P they run along the join line"],
      describe: "Yellow field lines curve from the positive charge to the negative charge, in 3D.",
      cue: { show: ["charges", "fieldLines", "probe", "Enet"], at: "tEnd", focus: "home" },
    },
  ],
  answer: { value: 5.09e6, unit: "N/C", label: "Electric field at P", tex: "5.09\\times10^{6}\\,\\mathrm{N/C}" },
});
